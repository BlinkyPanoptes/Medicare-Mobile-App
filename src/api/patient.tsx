import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.23:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Accept': 'application/json' },
});

// Attach the Bearer token from SecureStore before every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchPatients  = ()                      => apiClient.get('/patients');
export const createPatient  = (data: any)             => apiClient.post('/patients', data);
export const updatePatient  = (id: string, data: any) => apiClient.put(`/patients/${id}`, data);
export const deletePatient  = (id: string)            => apiClient.delete(`/patients/${id}`);