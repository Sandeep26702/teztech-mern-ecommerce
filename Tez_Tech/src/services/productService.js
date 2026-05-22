import axios from "axios";
import { getApiUrl } from "../utils/api.js";

const API = axios.create({
  baseURL: getApiUrl(),
});

// 🔍 Search + Pagination
export const getProducts = (params) => {
  return API.get("/products", { params });
};

//prodect details
export const getProductById = (id) => {
  return API.get(`/products/${id}`);
};
