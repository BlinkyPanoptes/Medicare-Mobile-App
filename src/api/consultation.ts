import apiClient from "./client";

export const fetchPatientConsultations = (patientId: number) => apiClient.get(`/consultations?patient_id=${patientId}`);