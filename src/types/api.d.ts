export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roles?: string[];
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Employee {
  employeeId: number;
  employeeCode: string;
  name: string;
  email: string;
  contactNo: string;
  roleId: number;
  roleName?: string;
  designation?: string;
  address?: string;
  location?: string;
  password?: string;
  isActive: boolean;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  claims?: RoleClaim[];
  createdAt: string;
  updatedAt?: string;
}

export interface RoleClaim {
  id: string;
  roleId: string;
  claimType: string;
  claimValue: string;
  createdAt: string;
}

export interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
  regNo: string;
  vatNo: string;
  importExportCode?: string;
  country: string;
  address?: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  faxNumber?: string;
  website?: string;
  alternateContactPerson?: string;
  alternateEmail?: string;
  alternatePhoneNumber?: string;
  companyType?: string;
  industry?: string;
  remarks?: string;
  isActive: boolean;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface ShippingCompany {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClearingAgent {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  contactPerson?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OceanFreightCompany {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  contactPerson?: string;
  vesselCapacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LocalTransportCompany {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  contactPerson?: string;
  fleetSize?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportDocMaster {
  id: string;
  documentType: string;
  documentName: string;
  description?: string;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Port {
  id: string;
  name: string;
  code: string;
  country: string;
  city?: string;
  type?: 'Sea' | 'Air' | 'Land';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
