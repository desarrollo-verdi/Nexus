import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Tu Backend de Node.js
});

api.interceptors.request.use(
  (config) => {

    if (config.url === "/auth/login") {
      const adminUser = import.meta.env.VITE_AUTH_ADMIN_USER;
      const adminPass = import.meta.env.VITE_AUTH_ADMIN_PASS;
      const tokenBasic = btoa(`${adminUser}:${adminPass}`);
      
      config.headers["Authorization"] = `Basic ${tokenBasic}`;
    } else {
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