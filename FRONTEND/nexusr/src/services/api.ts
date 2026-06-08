import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", 
});

// --- 🔐 INTERCEPTOR DE PETICIÓN (REQUEST) ---
api.interceptors.request.use(
  (config) => {
    // 1️⃣ Capa 1: Autenticación para el Login
    if (config.url === "/auth/login") {
      const adminUser = import.meta.env.VITE_AUTH_ADMIN_USER;
      const adminPass = import.meta.env.VITE_AUTH_ADMIN_PASS;
      
      if (adminUser && adminPass) {
        const tokenBasic = btoa(`${adminUser}:${adminPass}`);
        config.headers["Authorization"] = `Basic ${tokenBasic}`;
      } else {
        console.error("❌ Error: No se encontraron las credenciales VITE_AUTH_ADMIN en el archivo .env");
      }
    } else {
      // 2️⃣ Capa 2: Control preventivo de expiración de 8 horas en el cliente
      const loginTimestamp = localStorage.getItem("nexus_login_time");
      const ochoHorasEnMs = 8 * 60 * 60 * 1000; // 28,800,000 ms

      if (loginTimestamp) {
        const tiempoTranscurrido = Date.now() - parseInt(loginTimestamp, 10);
        
        // Si ya pasaron las 8 horas, borramos todo preventivamente antes de hacer la petición
        if (tiempoTranscurrido > ochoHorasEnMs) {
          console.warn("⏰ El tiempo de sesión local (8h) ha expirado. Forzando re-autenticación.");
          limpiarAutenticacion();
          config.cancelToken = new axios.CancelToken((cancel) => cancel("Sesión expirada localmente."));
          return config;
        }
      }

      // 3️⃣ Inyección del Token Bearer para el resto de los endpoints
      const token = localStorage.getItem("nexus_token");
      if (token && token !== "null" && token !== "undefined") {
        config.headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn("⚠️ Petición protegida sin un token válido en localStorage.");
      }
    }
  
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- 📥 INTERCEPTOR DE RESPUESTA (RESPONSE) ---
api.interceptors.response.use(
  (response) => {
    // Si el login fue exitoso, guardamos TODO lo que retorna el endpoint
    if (response.config.url === "/auth/login" && response.data?.success) {
      const data = response.data;

      localStorage.setItem("nexus_token", data.token);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      localStorage.setItem("nexus_auth_data", JSON.stringify(data)); // Guarda el payload completo
      localStorage.setItem("nexus_login_time", Date.now().toString()); // Guarda la marca de tiempo exacta del login
    }
    return response;
  },
  (error) => {
    // Si el servidor rechaza la petición por Token Inválido o Expirado (401 o 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Evitamos un bucle infinito si el error viene del propio formulario de login
      if (error.config.url !== "/auth/login") {
        console.error("🔴 Token inválido o expirado en el servidor. Cerrando sesión...");
        limpiarAutenticacion();
      }
    }
    return Promise.reject(error);
  }
);

// --- 🧹 FUNCIÓN AUXILIAR PARA LIMPIAR CACHÉ Y REDIRIGIR ---
const limpiarAutenticacion = () => {
  localStorage.removeItem("nexus_token");
  localStorage.removeItem("nexus_user");
  localStorage.removeItem("nexus_auth_data");
  localStorage.removeItem("nexus_login_time");
  
  // Fuerza la redirección a la pantalla de login y limpia el estado de la app
  if (window.location.pathname !== "/login") {
    window.location.href = "/login"; 
  }
};

export default api;