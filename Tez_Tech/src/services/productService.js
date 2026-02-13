import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🔍 Search + Pagination
export const getProducts = (params) => {
  return API.get("/products", { params });
};

//prodect details
export const getProductById = (id) => {
  return API.get(`/products/${id}`);
};
