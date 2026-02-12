import api from "./api";

export const createQuotation = (data) =>
  api.post("/quotation", data);
