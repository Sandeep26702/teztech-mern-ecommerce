import axios from "../utils/axios";

export const getMyOrders = () => {
  return axios.get("/orders/my-orders");

};
export const cancelOrder = (orderId) => {
  return axios.put(`/orders/${orderId}/cancel`);
};

export const getOrderById = (orderId) => {
  return axios.get(`/orders/${orderId}`);
};