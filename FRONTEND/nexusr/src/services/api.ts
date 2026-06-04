import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", 
});

api.interceptors.request.use(
  (config) => {
    // 🔐 Capa 1: Autenticación para el Login
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
      // 🔑 Capa 2: Token Bearer para el resto de los endpoints
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

export default api;