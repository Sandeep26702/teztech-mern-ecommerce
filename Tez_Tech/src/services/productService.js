import axios from "axios";

const API = axios.create({
  baseURL: "https://sonani-backend.onrender.com/api",
});

// 🔍 Search + Pagination
export const getProducts = (params) => {
  return API.get("/products", { params });
};

//prodect details
export const getProductById = (id) => {
  return API.get(`/products/${id}`);
};
