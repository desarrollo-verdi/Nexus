require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt'); 
const fs = require('fs');
const path = require('path');

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: [
    'http://localhost:5173', // Entorno de desarrollo local con Vite
    'http://localhost:1500'  // Entorno de producción corriendo en Docker
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Mantenemos Authorization activo
  credentials: true
}));
app.use(express.json());

// --- CONFIGURACIÓN DE LOGS PARA DOCKER VOLUME ---
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}
const logFilePath = path.join(logsDir, 'errores.log'); 

// --- FUNCIÓN GLOBAL PARA ESCRIBIR LOGS (OK y ERRORES) ---
const registrarLog = (tipo, accion, mensaje) => {
    const timestamp = new Date().toISOString();
    const lineaLog = `[${timestamp}] [${tipo}] [Acción: ${accion}] ${mensaje}\n`;
    
    fs.appendFileSync(logFilePath, lineaLog);
    if (tipo === 'ERROR' || tipo === 'CRÍTICO') {
        console.error(lineaLog.trim());
    } else {
        console.log(lineaLog.trim());
    }
};

// --- CONFIGURACIÓN DE BASE DE DATOS ---
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- SEGURIDAD: RATE LIMITERS ---

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: "Demasiadas peticiones. Intente más tarde." }
});
app.use(generalLimiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { error: "Demasiados intentos de inicio de sesión. Por seguridad, intente más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        registrarLog('CRÍTICO', 'N/A', `JSON Mal Formateado enviado por el cliente. Detalle: ${err.message}`);
        return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
    }
    next();
});

// =========================================================================
// --- RUTAS FIJAS / ESPECÍFICAS (Deben ir ARRIBA de la ruta dinámica) ---
// =========================================================================

// --- A. LOGIN TRADICIONAL CON MASTER KEY (Se mantiene intacto) ---
app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    const clientMasterKey = req.headers['x-api-key'];

    if (!clientMasterKey || clientMasterKey !== process.env.LOGIN_MASTER_KEY) {
        registrarLog('RECHAZADO', 'LOGIN_MASTER', 'Intento de login sin Master Key válida.');
        return res.status(403).json({ error: "No autorizado para acceder al login." });
    }

    if (user === process.env.API_USER && pass === process.env.API_PASS) {
        const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '2h' });
        registrarLog('OK', 'LOGIN_MASTER', `Usuario M-Key '${user}' autenticado exitosamente.`);
        return res.json({ success: true, token: token });
    }

    registrarLog('RECHAZADO', 'LOGIN_MASTER', `Intento fallido con usuario: '${user}'.`);
    res.status(401).json({ error: "Credenciales de usuario incorrectas." });
});


// --- B. NUEVO ENDPOINT: LOGIN DE USUARIOS PROTEGIDO CON HTTP BASIC AUTH 2.0 ---
app.post('/auth/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body; // El body queda limpio, solo datos del usuario final
    const authHeader = req.headers['authorization'];
    
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. VALIDACIÓN CAPA 1: Procesar e interceptar el "Basic Auth" de la pestaña Authorization
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        registrarLog('RECHAZADO', 'AUTH_LOGIN', 'Petición rechazada: Falta Basic Auth administrativo.');
        return res.status(401).json({ error: "Se requiere autenticación Basic Auth para acceder a este recurso." });
    }

    // Decodificar el string Base64 que envía de forma nativa la pestaña Authorization
    const b64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(b64Credentials, 'base64').toString('ascii');
    const [adminUser, adminPass] = credentials.split(':');

    // Validar contra las variables del .env
    if (adminUser !== process.env.AUTH_ADMIN_USER || adminPass !== process.env.AUTH_ADMIN_PASS) {
        registrarLog('RECHAZADO', 'AUTH_LOGIN', `Intento de acceso denegado. Basic Auth inválido para admin: '${adminUser}'.`);
        return res.status(403).json({ error: "Credenciales de administración inválidas." });
    }

    // 2. VALIDACIÓN CAPA 2: Verificar los datos del usuario que viene en el JSON Body
    if (!username || !password) {
        return res.status(400).json({ error: "El usuario y contraseña del cliente final son requeridos." });
    }

    try {
        // Ejecutar tu función personalizada en PostgreSQL
        const loginQuery = 'SELECT * FROM FN_N_AUTH_USER_LOGIN($1, $2)';
        const result = await pool.query(loginQuery, [username, ipAddress]);

        if (result.rows.length === 0) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Intento fallido: El usuario '${username}' no existe.`);
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        const cuenta = result.rows[0];

        // Validaciones de estado administrativo
        if (!cuenta.is_active || !cuenta.company_active) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Acceso denegado: Estado inactivo detectado para '${username}'.`);
            return res.status(403).json({ error: "El acceso a este usuario o compañía está deshabilitado." });
        }

        // Comparar el hash con Bcrypt
        const passwordValido = await bcrypt.compare(password, cuenta.password_hash);
        if (!passwordValido) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Contraseña incorrecta para el usuario '${username}'.`);
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        // ÉXITO: Confirmamos el login llamando a tu procedimiento almacenado
        await pool.query('CALL SP_N_AUTH_CONFIRM_LOGIN($1, $2)', [cuenta.user_id, ipAddress]);

        // Estructurar JWT con la data unificada
        const token = jwt.sign(
            { 
                id: cuenta.user_id, 
                username: cuenta.username, 
                company_id: cuenta.id_company,
                role: cuenta.role_name,
                permissions: cuenta.permissions 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h', algorithm: 'HS256' }
        );

        registrarLog('OK', 'AUTH_LOGIN', `Sesión iniciada: '${username}' mediante validación Gateway Basic Auth (Empresa: '${cuenta.company_name}').`);

        return res.json({
            success: true,
            token: token,
            user: {
                name: cuenta.full_name,
                username: cuenta.username,
                role: cuenta.role_name,
                company: cuenta.company_name,
                permissions: cuenta.permissions
            }
        });

    } catch (error) {
        registrarLog('ERROR', 'AUTH_LOGIN', `Error en pipeline de autenticación: ${error.message}`);
        return res.status(500).json({ error: "Error interno al procesar el inicio de sesión." });
    }
});


// =========================================================================
// --- MIDDLEWARES Y RUTAS DINÁMICAS (Se mantienen exactamente igual) ---
// =========================================================================

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // NOTA TÉCNICA: Como /auth/login usa "Basic ", tus rutas dinámicas usan "Bearer " del JWT. 
    // Este split extrae correctamente tokens JWT sin colisionar.
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || authHeader.startsWith('Basic ')) {
        registrarLog('RECHAZADO', req.params.accion || 'N/A', 'Acceso denegado: Token JWT no proporcionado.');
        return res.status(401).json({ error: "Token no proporcionado o inválido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            registrarLog('RECHAZADO', req.params.accion || 'N/A', 'Acceso denegado: Token inválido o expirado.');
            return res.status(403).json({ error: "Token inválido o expirado." });
        }
        req.user = decoded; 
        next();
    });
};

app.all('/:accion', authMiddleware, async (req, res) => {
    const { accion } = req.params;

    try {
        const configQuery = 'SELECT * FROM SP_N_API_ACTION_GETBYNAME($1)';
        const configRes = await pool.query(configQuery, [accion]);

        if (configRes.rows.length === 0) {
            return res.status(404).json({ error: `La acción '${accion}' no existe o está inactiva.` });
        }

        const filaConfig = configRes.rows[0];
        const procedure_name = filaConfig.procedure_name || filaConfig.PROCEDURE_NAME;
        const parameters = filaConfig.parameters || filaConfig.PARAMETERS;
        const method = filaConfig.method || filaConfig.METHOD;
        const required_permission = filaConfig.required_permission || filaConfig.REQUIRED_PERMISSION;

        if (method && req.method !== method.toUpperCase()) {
            registrarLog('RECHAZADO', accion, `Método HTTP incorrecto. Esperado: ${method}, Recibido: ${req.method}`);
            return res.status(405).json({ error: `Método ${req.method} no permitido para esta acción. Use ${method}.` });
        }

        if (required_permission) {
            const tienePermiso = req.user.permissions && req.user.permissions.includes(required_permission);
            if (!tienePermiso) {
                registrarLog('RECHAZADO', accion, `Usuario '${req.user.username}' intentó ejecutar acción sin el permiso requerido.`);
                return res.status(403).json({ error: "No tienes privilegios suficientes para realizar esta acción." });
            }
        }

        const datosDelCliente = req.method === 'GET' ? req.query : req.body;
        const values = [];
        const paramPlaceholders = [];

        parameters.forEach((param, index) => {
            let valorFinal;

            if (param.name === 'id_user_audit') {
                valorFinal = req.user.id;
            } else if (param.name === 'id_company_audit') {
                valorFinal = req.user.company_id;
            } else {
                valorFinal = datosDelCliente[param.name];
            }

            if (param.required && (valorFinal === undefined || valorFinal === null)) {
                throw new Error(`El parámetro '${param.name}' es obligatorio.`);
            }

            values.push(valorFinal !== undefined ? valorFinal : null);
            paramPlaceholders.push(`$${index + 1}::${param.type}`);
        });

        const sqlEjecucion = `SELECT * FROM ${procedure_name}(${paramPlaceholders.join(', ')})`;
        const resultadoFinal = await pool.query(sqlEjecucion, values);

        registrarLog('INFO-OK', accion, `Procedimiento ${procedure_name} ejecutado con éxito.`);

        if (resultadoFinal.rows.length > 0) {
            const responseData = resultadoFinal.rows.length === 1 ? resultadoFinal.rows[0] : resultadoFinal.rows;
            res.status(200).json(responseData);
        } else {
            res.status(200).json({ success: true, message: 'Proceso completado sin retorno de datos.' });
        }

    } catch (error) {
        registrarLog('ERROR', accion, error.message);
        const msgError = error.message.includes('obligatorio') ? error.message : "Error al procesar la solicitud en el motor de base de datos.";
        res.status(400).json({ success: false, error: msgError });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API Dinámica corriendo en el puerto ${PORT}`);
    console.log(`🔐 Seguridad: Gateway Basic Auth activo en /auth/login.`);
    console.log(`📂 BITÁCORA GLOBAL ACTIVA: Guardando logs en /logs/errores.log`);
});