import api from './api';

export const appointmentService = {
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getTodayAppointments: async () => {
    const response = await api.get('/appointments/today');
    return response.data;
  },

  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  bookAppointment: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  rescheduleAppointment: async (id, data) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  cancelAppointment: async (id, reason) => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  completeAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/complete`);
    return response.data;
  },

  markNoShow: async (id) => {
    const response = await api.patch(`/appointments/${id}/no-show`);
    return response.data;
  }
};
