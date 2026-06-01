require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt'); // Procesa el Hash compatible con crypt gen_salt('bf')
const fs = require('fs');
const path = require('path');

const app = express();

// Si estás usando Docker detrás de un proxy (Nginx, Traefik, etc.), activa esto para capturar IPs reales:
app.set('trust proxy', true);

app.use(cors({
  origin: [
    'http://localhost:5173', // Entorno de desarrollo local con Vite
    'http://localhost:1500'  // Entorno de producción corriendo en Docker
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], 
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

// 1. Limiter Global para las consultas y operaciones del sistema
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: "Demasiadas peticiones. Intente más tarde." }
});
app.use(generalLimiter);

// 2. Limiter Estricto para el Login de usuarios (Fuerza Bruta)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, // Bloqueo temporal tras 5 intentos fallidos
    message: { error: "Demasiados intentos de inicio de sesión. Por seguridad, intente más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- INTERCEPTOR PARA JSON MAL FORMATEADO (ERRORES CRÍTICOS) ---
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

// --- A. LOGIN TRADICIONAL CON MASTER KEY (API-to-API) ---
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

// --- B. NUEVO ENDPOINT: LOGIN DE USUARIOS CON MATRIZ DE PERMISOS ---
app.post('/auth/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    // Captura segura de la IP considerando proxies/contenedores
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son requeridos." });
    }

    try {
        // 1. Ejecutar tu función personalizada en PostgreSQL
        const loginQuery = 'SELECT * FROM FN_N_AUTH_USER_LOGIN($1, $2)';
        const result = await pool.query(loginQuery, [username, ipAddress]);

        // Si la tabla retorna vacía es porque el usuario no existe en la BD
        if (result.rows.length === 0) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Intento fallido: El usuario '${username}' no existe.`);
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        const cuenta = result.rows[0];

        // 2. Validaciones de estado administrativo (Usuario o Empresa Inactiva)
        if (!cuenta.is_active || !cuenta.company_active) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Acceso denegado: Estado inactivo detectado para '${username}'.`);
            return res.status(403).json({ error: "El acceso a este usuario o compañía está deshabilitado." });
        }

        // 3. Comparar el hash con Bcrypt (Valida de forma transparente crypt gen_salt('bf'))
        const passwordValido = await bcrypt.compare(password, cuenta.password_hash);
        if (!passwordValido) {
            registrarLog('RECHAZADO', 'AUTH_LOGIN', `Contraseña incorrecta para el usuario '${username}'.`);
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        // 4. ÉXITO: Confirmamos el login llamando a tu procedimiento almacenado
        await pool.query('CALL SP_N_AUTH_CONFIRM_LOGIN($1, $2)', [cuenta.user_id, ipAddress]);

        // 5. Estructurar JWT con la data unificada (Incluyendo los slugs de permisos)
        const token = jwt.sign(
            { 
                id: cuenta.user_id, 
                username: cuenta.username, 
                company_id: cuenta.id_company,
                role: cuenta.role_name,
                permissions: cuenta.permissions // Array estructurado: ["user:create", "user:edit"]
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h', algorithm: 'HS256' }
        );

        registrarLog('OK', 'AUTH_LOGIN', `Sesión iniciada: '${username}' de la empresa '${cuenta.company_name}'.`);

        // Respuesta optimizada para almacenar los estados en el Frontend
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
// --- MIDDLEWARES Y RUTAS DINÁMICAS (Actúan como interceptores finales) ---
// =========================================================================

// --- MIDDLEWARE DE VALIDACIÓN DE JWT ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        registrarLog('RECHAZADO', req.params.accion || 'N/A', 'Acceso denegado: Token no proporcionado.');
        return res.status(401).json({ error: "Token no proporcionado." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            registrarLog('RECHAZADO', req.params.accion || 'N/A', 'Acceso denegado: Token inválido o expirado.');
            return res.status(403).json({ error: "Token inválido o expirado." });
        }
        req.user = decoded; // Expone la info del token para inyecciones de auditoría en req.user
        next();
    });
};

// --- RUTA DINÁMICA DATA-DRIVEN (GET y POST) CON CONTROL DE PERMISOS ---
app.all('/:accion', authMiddleware, async (req, res) => {
    const { accion } = req.params;

    try {
        // A. Buscar configuración del endpoint en la BD
        const configQuery = 'SELECT * FROM SP_N_API_ACTION_GETBYNAME($1)';
        const configRes = await pool.query(configQuery, [accion]);

        if (configRes.rows.length === 0) {
            return res.status(404).json({ error: `La acción '${accion}' no existe o está inactiva.` });
        }

        // Mapeo seguro tolerante al formato nativo de Postgres (Mayúsculas o Minúsculas)
        const filaConfig = configRes.rows[0];
        const procedure_name = filaConfig.procedure_name || filaConfig.PROCEDURE_NAME;
        const parameters = filaConfig.parameters || filaConfig.PARAMETERS;
        const method = filaConfig.method || filaConfig.METHOD;
        const required_permission = filaConfig.required_permission || filaConfig.REQUIRED_PERMISSION;

        // 1. VALIDACIÓN DE MÉTODO HTTP
        if (method && req.method !== method.toUpperCase()) {
            registrarLog('RECHAZADO', accion, `Método HTTP incorrecto. Esperado: ${method}, Recibido: ${req.method}`);
            return res.status(405).json({ error: `Método ${req.method} no permitido para esta acción. Use ${method}.` });
        }

        // 2. COMPUERTA DE CONTROL DE PERMISOS OPERATIVOS (RBAC)
        if (required_permission) {
            const tienePermiso = req.user.permissions && req.user.permissions.includes(required_permission);
            
            // Debug útil para consola en desarrollo
            console.log(`[RBAC] Acción: /${accion} | Reclama: [${required_permission}] | Usuario posee:`, req.user.permissions || 'Ninguno');

            if (!tienePermiso) {
                registrarLog('RECHAZADO', accion, `Usuario '${req.user.username}' intentó ejecutar acción sin el permiso requerido: [${required_permission}].`);
                return res.status(403).json({ error: "No tienes privilegios suficientes para realizar esta acción." });
            }
        }

        // CAPTURA DINÁMICA: Query params para GET, Body para POST
        const datosDelCliente = req.method === 'GET' ? req.query : req.body;

        const values = [];
        const paramPlaceholders = [];

        // 3. MAPEO, VALIDACIÓN E INYECCIÓN AUTOMÁTICA DE CONTEXTO/AUDITORÍA
        parameters.forEach((param, index) => {
            let valorFinal;

            // Inyección transparente de variables seguras del JWT
            if (param.name === 'id_user_audit') {
                valorFinal = req.user.id;
            } else if (param.name === 'id_company_audit') {
                valorFinal = req.user.company_id;
            } else {
                // Parámetro operativo enviado por el Frontend
                valorFinal = datosDelCliente[param.name];
            }

            // Validar campos requeridos
            if (param.required && (valorFinal === undefined || valorFinal === null)) {
                throw new Error(`El parámetro '${param.name}' es obligatorio.`);
            }

            values.push(valorFinal !== undefined ? valorFinal : null);
            paramPlaceholders.push(`$${index + 1}::${param.type}`);
        });

        // C. Ejecución blindada del SP de negocio
        const sqlEjecucion = `SELECT * FROM ${procedure_name}(${paramPlaceholders.join(', ')})`;
        const resultadoFinal = await pool.query(sqlEjecucion, values);

        // D. LOG DE ÉXITO
        registrarLog('INFO-OK', accion, `Procedimiento ${procedure_name} ejecutado con éxito por ${req.method}.`);

        // E. Respuesta formateada inteligente
        if (resultadoFinal.rows.length > 0) {
            const responseData = resultadoFinal.rows.length === 1 ? resultadoFinal.rows[0] : resultadoFinal.rows;
            res.status(200).json(responseData);
        } else {
            res.status(200).json({ success: true, message: 'Proceso completado sin retorno de datos.' });
        }

    } catch (error) {
        registrarLog('ERROR', accion, error.message);
        
        // Mensaje controlado si el error viene provocado por validaciones internas de Node
        const msgError = error.message.includes('obligatorio') ? error.message : "Error al procesar la solicitud en el motor de base de datos.";
        
        res.status(400).json({ 
            success: false, 
            error: msgError
        });
    }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API Dinámica corriendo en el puerto ${PORT}`);
    console.log(`🔐 Seguridad: RateLimit, JWT, Bcrypt y segregación de endpoints con RBAC activos.`);
    console.log(`📂 BITÁCORA GLOBAL ACTIVA: Guardando logs en /logs/errores.log`);
});