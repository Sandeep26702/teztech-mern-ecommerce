import axios from 'axios';
import { getApiUrl } from '../utils/api.js';

// Ek professional central API instance banate hain
const API = axios.create({
  baseURL: `${getApiUrl()}/orders`,
});

// Request Interceptor: Har request se pehle token check karega aur lagayega
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * @description 1. User: Naya Order Place Karne ke liye
 */
export const placeNewOrder = async (orderData) => {
  try {
    // 🔥 THE FIX: Check agar data FormData hai (matlab usme image hai)
    const isFormData = orderData instanceof FormData;

    const { data } = await API.post('/create', orderData, {
      // Agar image hai toh explicitly header set karo, warna blank chhod do
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return data;
  } catch (error) {
    // Preserve full axios error so caller can read status + response payload
    throw error;
  }
};

/**
 * @description 2. User: Sirf apne orders dekhne ke liye (My Orders Page)
 */
export const getMyOrders = async () => {
  try {
    const { data } = await API.get('/my-orders');
    return data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch your orders";
  }
};

/**
 * @description 3. Admin: Saare users ke orders dekhne ke liye
 */
export const fetchAdminOrders = async () => {
  try {
    const { data } = await API.get('/admin/all');
    return data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch all orders";
  }
};

/**
 * @description 4. Admin/User: Kisi ek order ki detail nikalne ke liye
 */
export const getOrderById = async (orderId) => {
  try {
    const { data } = await API.get(`/detail/${orderId}`);
    return data;
  } catch (error) {
    throw error.response?.data?.message || "Order details not found";
  }
};

/**
 * @description 5. Admin: Order ka status update karne ke liye (Shipped, Delivered etc.)
 */
export const updateAdminOrderStatus = async (orderId, statusData) => {
  try {
    const { data } = await API.put(`/admin/update/${orderId}`, statusData);
    return data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to update order status";
  }
};

export default {
  placeNewOrder,
  getMyOrders,
  fetchAdminOrders,
  getOrderById,
  updateAdminOrderStatus
};