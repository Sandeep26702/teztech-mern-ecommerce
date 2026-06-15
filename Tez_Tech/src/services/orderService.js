import axios from 'axios';
import { getApiUrl } from '../utils/api.js';

// Create a professional central API instance
const API = axios.create({
  baseURL: `${getApiUrl()}/orders`,
});

// Request Interceptor: Checks and attaches the token before every request
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
 * @description 1. User: For placing a new order
 */
export const placeNewOrder = async (orderData) => {
  try {
    // 🔥 THE FIX: Check if data is FormData (meaning it contains an image)
    const isFormData = orderData instanceof FormData;

    const { data } = await API.post('/create', orderData, {
      // If there is an image, set the header explicitly, otherwise leave it blank
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return data;
  } catch (error) {
    // Preserve full axios error so caller can read status + response payload
    throw error;
  }
};

/**
 * @description 2. User: For viewing only their own orders (My Orders Page)
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
 * @description 3. Admin: For viewing orders of all users
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
 * @description 4. Admin/User: For retrieving details of a single order
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
 * @description 5. Admin: For updating order status (Shipped, Delivered, etc.)
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