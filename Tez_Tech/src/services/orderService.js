import axios from "../utils/axios";

export const getMyOrders = () => {
  return axios.get("/orders/my-orders");
};
