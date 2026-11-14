import api from './api';

export const reportService = {
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getAppointmentReport: async (params = {}) => {
    const response = await api.get('/reports/appointments', { params });
    return response.data;
  },

  getBillingReport: async (params = {}) => {
    const response = await api.get('/reports/billing', { params });
    return response.data;
  },

  exportAppointmentsCsvUrl: (startDate, endDate) => {
    let url = '/api/v1/reports/appointments/export';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  },

  exportBillingCsvUrl: (startDate, endDate) => {
    let url = '/api/v1/reports/billing/export';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }
};
