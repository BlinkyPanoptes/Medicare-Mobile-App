import apiClient from "./client";

export const fetchPatients  = ()                       => apiClient.get("/patients");
export const createPatient  = (data: any)              => apiClient.post("/patients", data);
export const updatePatient  = (id: number, data: any)  => apiClient.put(`/patients/${id}`, data);
export const deletePatient  = (id: number)             => apiClient.delete(`/patients/${id}`);