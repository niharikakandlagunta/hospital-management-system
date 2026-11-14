import api from './api';

export const patientService = {
  getPatients: async (params = {}) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
  },

  updatePatient: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  setPatientStatus: async (id, active) => {
    const response = await api.patch(`/patients/${id}/status`, null, {
      params: { active }
    });
    return response.data;
  },

  getPatientAppointments: async (id) => {
    const response = await api.get(`/patients/${id}/appointments`);
    return response.data;
  }
};
