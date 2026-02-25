import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

// Helper to get headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };
};

// 1. User: Place Order
export const placeNewOrder = async (orderData) => {
  const response = await axios.post(`${API_URL}/create`, orderData, getAuthHeaders());
  return response.data;
};

// 2. Admin: Get All Orders
export const fetchAdminOrders = async () => {
  const response = await axios.get(`${API_URL}/admin/all`, getAuthHeaders());
  return response.data;
};

// 3. Admin/User: Get Single Order Detail (Yeh missing tha)
export const getOrderById = async (orderId) => {
  const response = await axios.get(`${API_URL}/detail/${orderId}`, getAuthHeaders());
  return response.data;
};

// 4. Admin: Update Order Status
export const updateAdminOrderStatus = async (orderId, statusData) => {
  const response = await axios.put(`${API_URL}/admin/update/${orderId}`, statusData, getAuthHeaders());
  return response.data;
};