import api from './api';

export const billingService = {
  getBills: async (params = {}) => {
    const response = await api.get('/bills', { params });
    return response.data;
  },

  getBillById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },

  generateBill: async (data) => {
    const response = await api.post('/bills', data);
    return response.data;
  },

  recordPayment: async (billId, data) => {
    const response = await api.post(`/bills/${billId}/payments`, data);
    return response.data;
  },

  getBillPayments: async (billId) => {
    const response = await api.get(`/bills/${billId}/payments`);
    return response.data;
  },

  getAllPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  }
};
