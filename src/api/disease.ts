import apiClient from "./client";

export const fetchDiseases    = (page = 1)              => apiClient.get(`/diseases?page=${page}`);
export const fetchDiseaseById = (id: number)            => apiClient.get(`/diseases/${id}`);
export const createDisease    = (data: any)             => apiClient.post("/diseases", data);
export const updateDisease    = (id: number, data: any) => apiClient.put(`/diseases/${id}`, data);
export const deleteDisease    = (id: number)            => apiClient.delete(`/diseases/${id}`);