import api from './api';

export const medicalRecordService = {
  getMedicalRecords: async (params = {}) => {
    const response = await api.get('/medical-records', { params });
    return response.data;
  },

  getMedicalRecordById: async (id) => {
    const response = await api.get(`/medical-records/${id}`);
    return response.data;
  },

  createMedicalRecord: async (data) => {
    const response = await api.post('/medical-records', data);
    return response.data;
  },

  updateMedicalRecord: async (id, data) => {
    const response = await api.put(`/medical-records/${id}`, data);
    return response.data;
  },

  getPatientMedicalRecords: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/medical-records`);
    return response.data;
  }
};
