import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Tu Backend de Node.js
});

// Interceptor de peticiones salientes
api.interceptors.request.use(
  (config) => {
    // 1. CAPA PERIMETRAL: Si va al login de usuarios, inyectamos el Basic Auth administrativo
    if (config.url === "/auth/login") {
      // Consumimos las variables de entorno de Vite de forma segura
      const adminUser = import.meta.env.VITE_AUTH_ADMIN_USER;
      const adminPass = import.meta.env.VITE_AUTH_ADMIN_PASS;
      
      // btoa() transforma nativamente el formato "usuario:clave" a un hash Base64 válido
      const tokenBasic = btoa(`${adminUser}:${adminPass}`);
      
      config.headers["Authorization"] = `Basic ${tokenBasic}`;
    } else {
      // 2. CAPA OPERATIVA: Para el resto de rutas dinámicas, inyectamos el token JWT del usuario
      const token = localStorage.getItem("nexus_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;