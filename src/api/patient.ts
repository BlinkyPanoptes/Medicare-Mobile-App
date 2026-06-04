import { API_URL } from "@/api/config";
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Accept': 'application/json' },
});

// Attach Bearer token AND X-Clinic-ID before every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Read the active clinic and attach its ID as a header
  // This matches what PatientController reads via $request->header('X-Clinic-ID')
  const storedClinic = await SecureStore.getItemAsync('activeClinic');
  if (storedClinic) {
    const clinic = JSON.parse(storedClinic);
    config.headers['X-Clinic-ID'] = clinic.id;
  }

  return config;
});

export const fetchPatients    = ()                      => apiClient.get('/patients');
export const fetchPatientById = (id: string | number)   => apiClient.get(`/patients/${id}`);
export const createPatient    = (data: any)             => apiClient.post('/patients', data);
export const updatePatient    = (id: string | number, data: any) => apiClient.put(`/patients/${id}`, data);
export const deletePatient    = (id: string | number)   => apiClient.delete(`/patients/${id}`);