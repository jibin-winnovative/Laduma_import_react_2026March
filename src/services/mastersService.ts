import { api } from './apiClient';
import {
  Role,
  RoleClaim,
  ShippingCompany,
  ClearingAgent,
  OceanFreightCompany,
  LocalTransportCompany,
  ImportDocMaster,
  Port,
} from '../types/api';

const createCrudService = <T>(basePath: string) => ({
  getAll: async (): Promise<T[]> => api.get<T[]>(basePath),
  getById: async (id: string): Promise<T> => api.get<T>(`${basePath}/${id}`),
  create: async (data: Partial<T>): Promise<T> => api.post<T>(basePath, data),
  update: async (id: string, data: Partial<T>): Promise<T> => api.put<T>(`${basePath}/${id}`, data),
  delete: async (id: string): Promise<void> => api.delete<void>(`${basePath}/${id}`),
});

export const rolesService = createCrudService<Role>('/api/Roles');
export const roleClaimsService = createCrudService<RoleClaim>('/api/RoleClaims');
export const shippingCompaniesService = createCrudService<ShippingCompany>('/api/ShippingCompanies');
export const oceanFreightCompaniesService = createCrudService<OceanFreightCompany>('/api/OceanFreightCompanies');
export const localTransportCompaniesService = createCrudService<LocalTransportCompany>('/api/LocalTransportCompanies');
export const importDocMastersService = createCrudService<ImportDocMaster>('/api/ImportDocMasters');
export const portsService = createCrudService<Port>('/api/Ports');

export const mastersService = {
  getCountries: async (): Promise<string[]> => {
    const response = await api.get<{ data: string[] }>('/api/masters/countries');
    return response.data;
  },
};
