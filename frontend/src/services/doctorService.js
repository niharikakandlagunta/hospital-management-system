import api from './api';

export const doctorService = {
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (data) => {
    const response = await api.post('/doctors', data);
    return response.data;
  },

  updateDoctor: async (id, data) => {
    const response = await api.put(`/doctors/${id}`, data);
    return response.data;
  },

  getDoctorAvailability: async (id, date) => {
    const response = await api.get(`/doctors/${id}/availability`, {
      params: { date }
    });
    return response.data;
  },

  getDoctorSchedules: async (id) => {
    const response = await api.get(`/doctors/${id}/schedules`);
    return response.data;
  },

  addOrUpdateSchedule: async (id, data) => {
    const response = await api.post(`/doctors/${id}/schedules`, data);
    return response.data;
  },

  setDoctorAvailability: async (id, available) => {
    const response = await api.patch(`/doctors/${id}/availability`, null, {
      params: { available }
    });
    return response.data;
  },

  getDoctorAppointments: async (id) => {
    const response = await api.get(`/doctors/${id}/appointments`);
    return response.data;
  }
};
