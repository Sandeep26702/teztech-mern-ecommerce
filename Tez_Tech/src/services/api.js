import axios from "axios";
import { getApiUrl } from "../utils/api.js";

const api = axios.create({
  baseURL: getApiUrl(),
});

export default api;
