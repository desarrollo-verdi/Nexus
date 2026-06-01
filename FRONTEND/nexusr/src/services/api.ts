import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", 
});

api.interceptors.request.use(
  (config) => {
    // Recuperamos el token único del usuario logueado desde /auth/login
    const token = localStorage.getItem("nexus_token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;