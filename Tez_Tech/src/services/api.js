import axios from "axios";

const api = axios.create({
  baseURL: "https://sonani-backend.onrender.com/api",
});

export default api;
