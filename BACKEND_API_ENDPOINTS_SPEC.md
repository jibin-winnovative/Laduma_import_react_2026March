# Backend API Endpoints Specification

This document outlines all the API endpoints required by the Import Management System frontend application.

---

## 📋 Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Roles & Permissions (Claims)](#roles--permissions-claims)
3. [Employees](#employees)
4. [Companies](#companies)
5. [Shipping Companies](#shipping-companies)
6. [Clearing Agents](#clearing-agents)
7. [Ocean Freight Companies](#ocean-freight-companies)
8. [Local Transport Companies](#local-transport-companies)
9. [Ports](#ports)
10. [Common Response Patterns](#common-response-patterns)

---

## 🔐 Authentication & User Management

### 1. Login
**Endpoint:** `POST /api/Auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "employeeId": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Administrator"
  }
}
```

### 2. Logout
**Endpoint:** `POST /api/Auth/logout`

**Headers:**
- `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 3. Get Current User
**Endpoint:** `GET /api/Auth/me`

**Headers:**
- `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "id": "123",
  "email": "user@example.com",
  "username": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Administrator",
  "roles": ["Administrator"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 4. Refresh Token
**Endpoint:** `POST /api/Auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "username": "John Doe"
  }
}
```

### 5. Change Password
**Endpoint:** `POST /api/Auth/change-password`

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🛡️ Roles & Permissions (Claims)

### 1. Get All Roles
**Endpoint:** `GET /api/Roles`

**Query Parameters:**
- `isActive` (optional): `true` | `false`
- `searchTerm` (optional): string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roleId": 1,
      "roleName": "Administrator",
      "description": "Full system access",
      "isActive": true,
      "roleClaims": [
        {
          "roleClaimId": 1,
          "roleId": 1,
          "claimType": "Employee.Create",
          "claimValue": "true",
          "description": "Create Employee",
          "isActive": true
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "createdBy": "admin",
      "updatedBy": "admin"
    }
  ]
}
```

### 2. Get Role by ID
**Endpoint:** `GET /api/Roles/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "roleId": 1,
    "roleName": "Administrator",
    "description": "Full system access",
    "isActive": true,
    "roleClaims": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Create Role
**Endpoint:** `POST /api/Roles`

**Request Body:**
```json
{
  "roleName": "Manager",
  "description": "Manager level access",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "roleId": 2,
    "roleName": "Manager",
    "description": "Manager level access",
    "isActive": true
  }
}
```

### 4. Update Role
**Endpoint:** `PUT /api/Roles/{id}`

**Request Body:**
```json
{
  "roleName": "Manager",
  "description": "Updated description",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "roleId": 2,
    "roleName": "Manager",
    "description": "Updated description",
    "isActive": true
  }
}
```

### 5. Delete Role
**Endpoint:** `DELETE /api/Roles/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### 6. Get All Available Claims (System Permissions)
**Endpoint:** `GET /api/Roles/claims/all`

**Response:**
```json
{
  "success": true,
  "message": "All permission claims retrieved successfully",
  "data": [
    {
      "module": "Employee",
      "claims": [
        { "key": "Employee.Create", "label": "Create Employee" },
        { "key": "Employee.Read", "label": "Read Employee" },
        { "key": "Employee.Update", "label": "Update Employee" },
        { "key": "Employee.Delete", "label": "Delete Employee" }
      ]
    },
    {
      "module": "Company",
      "claims": [
        { "key": "Company.Create", "label": "Create Company" },
        { "key": "Company.Read", "label": "Read Company" },
        { "key": "Company.Update", "label": "Update Company" },
        { "key": "Company.Delete", "label": "Delete Company" }
      ]
    },
    {
      "module": "Port",
      "claims": [
        { "key": "Port.Create", "label": "Create Port" },
        { "key": "Port.Read", "label": "Read Port" },
        { "key": "Port.Update", "label": "Update Port" },
        { "key": "Port.Delete", "label": "Delete Port" }
      ]
    },
    {
      "module": "ShippingCompany",
      "claims": [
        { "key": "ShippingCompany.Create", "label": "Create Shipping Company" },
        { "key": "ShippingCompany.Read", "label": "Read Shipping Company" },
        { "key": "ShippingCompany.Update", "label": "Update Shipping Company" },
        { "key": "ShippingCompany.Delete", "label": "Delete Shipping Company" }
      ]
    },
    {
      "module": "ClearingAgent",
      "claims": [
        { "key": "ClearingAgent.Create", "label": "Create Clearing Agent" },
        { "key": "ClearingAgent.Read", "label": "Read Clearing Agent" },
        { "key": "ClearingAgent.Update", "label": "Update Clearing Agent" },
        { "key": "ClearingAgent.Delete", "label": "Delete Clearing Agent" }
      ]
    },
    {
      "module": "OceanFreight",
      "claims": [
        { "key": "OceanFreight.Create", "label": "Create Ocean Freight Company" },
        { "key": "OceanFreight.Read", "label": "Read Ocean Freight Company" },
        { "key": "OceanFreight.Update", "label": "Update Ocean Freight Company" },
        { "key": "OceanFreight.Delete", "label": "Delete Ocean Freight Company" }
      ]
    },
    {
      "module": "LocalTransport",
      "claims": [
        { "key": "LocalTransport.Create", "label": "Create Local Transport Company" },
        { "key": "LocalTransport.Read", "label": "Read Local Transport Company" },
        { "key": "LocalTransport.Update", "label": "Update Local Transport Company" },
        { "key": "LocalTransport.Delete", "label": "Delete Local Transport Company" }
      ]
    },
    {
      "module": "Role",
      "claims": [
        { "key": "Role.Create", "label": "Create Role" },
        { "key": "Role.Read", "label": "Read Role" },
        { "key": "Role.Update", "label": "Update Role" },
        { "key": "Role.Delete", "label": "Delete Role" },
        { "key": "Role.ManageClaims", "label": "Manage Role Claims" }
      ]
    }
  ]
}
```

**Note:** This endpoint returns ALL available system permissions grouped by functional module. The frontend uses this to show administrators which permissions exist in the system.

### 7. Get Claims for a Specific Role
**Endpoint:** `GET /api/Roles/{roleId}/claims`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roleClaimId": 1,
      "roleId": 1,
      "claimType": "Employee.Create",
      "claimValue": "true",
      "description": "Create Employee",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "roleClaimId": 2,
      "roleId": 1,
      "claimType": "Employee.Read",
      "claimValue": "true",
      "description": "Read Employee",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** Returns the claims currently assigned to the specified role. The frontend filters for `isActive: true` claims and extracts the `claimType` field to pre-select checkboxes in the Manage Claims modal.

### 8. Bulk Save Role Claims (NEW - CRITICAL)
**Endpoint:** `POST /api/Roles/{roleId}/claims/bulk`

**Request Body:**
```json
{
  "roleId": 1,
  "claimKeys": [
    "Employee.Create",
    "Employee.Read",
    "Employee.Update",
    "Company.Create",
    "Company.Read",
    "Port.Read"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role claims updated successfully",
  "data": {
    "roleId": 1,
    "claimsAdded": 6,
    "claimsRemoved": 2,
    "totalActiveClaims": 6
  }
}
```

**Implementation Notes:**
- This endpoint should **REPLACE** all existing claims for the role with the new set
- Algorithm:
  1. Get all existing role claims for the roleId
  2. Mark all existing claims as `isActive = false` (soft delete)
  3. For each claimKey in the request:
     - If a matching claim already exists, set `isActive = true`
     - If it doesn't exist, create a new RoleClaim record with `isActive = true`
  4. Return success with counts

### 9. Create Individual Role Claim
**Endpoint:** `POST /api/Roles/claims`

**Request Body:**
```json
{
  "roleId": 1,
  "claimType": "Employee.Create",
  "claimValue": "true",
  "description": "Create Employee",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role claim created successfully",
  "data": {
    "roleClaimId": 10,
    "roleId": 1,
    "claimType": "Employee.Create",
    "claimValue": "true",
    "isActive": true
  }
}
```

### 10. Update Individual Role Claim
**Endpoint:** `PUT /api/Roles/claims/{id}`

**Request Body:**
```json
{
  "claimType": "Employee.Create",
  "claimValue": "true",
  "description": "Updated description",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role claim updated successfully",
  "data": {
    "roleClaimId": 10,
    "claimType": "Employee.Create",
    "isActive": true
  }
}
```

### 11. Delete Individual Role Claim
**Endpoint:** `DELETE /api/Roles/claims/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Role claim deleted successfully"
}
```

---

## 👥 Employees

### 1. Get All Employees
**Endpoint:** `GET /api/Employees`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "email": "employee@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "jdoe",
      "role": "Manager",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Employee by ID
**Endpoint:** `GET /api/Employees/{id}`

### 3. Create Employee
**Endpoint:** `POST /api/Employees`

### 4. Update Employee
**Endpoint:** `PUT /api/Employees/{id}`

### 5. Delete Employee
**Endpoint:** `DELETE /api/Employees/{id}`

---

## 🏢 Companies

### 1. Get Companies List (Paginated)
**Endpoint:** `GET /api/Companies`

**Query Parameters:**
- `pageNumber` (optional): number (default: 1)
- `pageSize` (optional): number (default: 10)
- `searchTerm` (optional): string
- `country` (optional): string
- `isActive` (optional): `true` | `false`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "companyId": 1,
        "companyCode": "COMP001",
        "companyName": "ABC Trading Ltd",
        "registrationNumber": "REG12345",
        "country": "South Africa",
        "city": "Johannesburg",
        "address": "123 Main Street",
        "vatNumber": "VAT123456",
        "contactPerson": "John Smith",
        "email": "contact@abc.com",
        "phoneNumber": "+27123456789",
        "website": "https://abc.com",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "createdBy": "admin",
        "updatedBy": "admin"
      }
    ],
    "totalRecords": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 2. Get Company by ID
**Endpoint:** `GET /api/Companies/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": 1,
    "companyCode": "COMP001",
    "companyName": "ABC Trading Ltd",
    "registrationNumber": "REG12345",
    "country": "South Africa",
    "city": "Johannesburg",
    "address": "123 Main Street",
    "vatNumber": "VAT123456",
    "contactPerson": "John Smith",
    "email": "contact@abc.com",
    "phoneNumber": "+27123456789",
    "faxNumber": "+27123456788",
    "website": "https://abc.com",
    "alternateContactPerson": "Jane Doe",
    "alternateEmail": "jane@abc.com",
    "alternatePhoneNumber": "+27987654321",
    "businessType": "Trading",
    "remarks": "Important client",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Create Company
**Endpoint:** `POST /api/Companies`

**Request Body:**
```json
{
  "companyCode": "COMP002",
  "companyName": "XYZ Corp",
  "registrationNumber": "REG54321",
  "country": "South Africa",
  "city": "Cape Town",
  "address": "456 Oak Avenue",
  "vatNumber": "VAT654321",
  "contactPerson": "Mike Jones",
  "email": "info@xyz.com",
  "phoneNumber": "+27111222333",
  "website": "https://xyz.com",
  "isActive": true
}
```

### 4. Update Company
**Endpoint:** `PUT /api/Companies/{id}`

### 5. Delete Company
**Endpoint:** `DELETE /api/Companies/{id}`

### 6. Check Company Code Exists
**Endpoint:** `GET /api/Companies/check-code`

**Query Parameters:**
- `code` (required): string
- `excludeId` (optional): number

**Response:**
```json
{
  "exists": true
}
```

### 7. Check Registration Number Exists
**Endpoint:** `GET /api/Companies/check-regno`

**Query Parameters:**
- `regNo` (required): string
- `excludeId` (optional): number

**Response:**
```json
{
  "exists": false
}
```

### 8. Get Companies Summary
**Endpoint:** `GET /api/Companies/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCompanies": 150,
    "activeCompanies": 120,
    "totalCountries": 5,
    "lastUpdatedDate": "2024-01-15T10:30:00Z",
    "lastUpdatedBy": "admin",
    "formattedLastUpdated": "2024-01-15 at 10:30 AM by admin"
  }
}
```

### 9. Export Companies to Excel
**Endpoint:** `GET /api/Companies/export/excel`

**Query Parameters:**
- `searchTerm` (optional): string
- `country` (optional): string
- `isActive` (optional): `true` | `false`

**Response:** Binary file (Excel format)

**Headers:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename=companies_export.xlsx`

---

## 🚢 Shipping Companies

### 1. Get Shipping Companies List (Paginated)
**Endpoint:** `GET /api/ShippingCompanies`

**Query Parameters:**
- `pageNumber` (optional): number
- `pageSize` (optional): number
- `searchTerm` (optional): string
- `serviceType` (optional): string
- `isActive` (optional): `true` | `false`

**Response:** Similar to Companies with shipping-specific fields

### 2. Get Shipping Company by ID
**Endpoint:** `GET /api/ShippingCompanies/{id}`

### 3. Create Shipping Company
**Endpoint:** `POST /api/ShippingCompanies`

### 4. Update Shipping Company
**Endpoint:** `PUT /api/ShippingCompanies/{id}`

### 5. Delete Shipping Company
**Endpoint:** `DELETE /api/ShippingCompanies/{id}`

### 6. Check Company Name Exists
**Endpoint:** `GET /api/ShippingCompanies/check-name`

**Query Parameters:**
- `name` (required): string
- `excludeId` (optional): number

### 7. Check Company Code Exists
**Endpoint:** `GET /api/ShippingCompanies/check-code`

### 8. Get Summary
**Endpoint:** `GET /api/ShippingCompanies/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalShippingCompanies": 45,
    "activeShippingCompanies": 40,
    "totalServiceTypes": 3,
    "lastUpdatedDate": "2024-01-15T10:30:00Z",
    "lastUpdatedBy": "admin",
    "formattedLastUpdated": "2024-01-15 at 10:30 AM by admin"
  }
}
```

### 9. Export to Excel
**Endpoint:** `GET /api/ShippingCompanies/export/excel`

---

## 🛃 Clearing Agents

### 1. Get Clearing Agents List (Paginated)
**Endpoint:** `GET /api/ClearingAgents`

**Query Parameters:**
- `pageNumber` (optional): number
- `pageSize` (optional): number
- `searchTerm` (optional): string
- `country` (optional): string
- `isActive` (optional): `true` | `false`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "clearingAgentId": 1,
        "code": "CA001",
        "agentName": "Swift Clearing Services",
        "vatNumber": "VAT789456",
        "country": "South Africa",
        "contactPerson": "Sarah Johnson",
        "email": "sarah@swift.com",
        "phoneNumber": "+27123456789",
        "address": "789 Trade Street",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalRecords": 30,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

### 2. Get Clearing Agent by ID
**Endpoint:** `GET /api/ClearingAgents/{id}`

### 3. Create Clearing Agent
**Endpoint:** `POST /api/ClearingAgents`

### 4. Update Clearing Agent
**Endpoint:** `PUT /api/ClearingAgents/{id}`

### 5. Delete Clearing Agent
**Endpoint:** `DELETE /api/ClearingAgents/{id}`

### 6. Check Code Exists
**Endpoint:** `GET /api/ClearingAgents/check-code`

### 7. Check VAT Number Exists
**Endpoint:** `GET /api/ClearingAgents/check-vat`

**Query Parameters:**
- `vatNumber` (required): string
- `excludeId` (optional): number

### 8. Get Summary
**Endpoint:** `GET /api/ClearingAgents/summary`

### 9. Get Countries List
**Endpoint:** `GET /api/ClearingAgents/countries`

**Response:**
```json
{
  "success": true,
  "data": ["South Africa", "Namibia", "Botswana", "Zimbabwe"]
}
```

### 10. Export to Excel
**Endpoint:** `GET /api/ClearingAgents/export/excel`

---

## 🌊 Ocean Freight Companies

### 1. Get Ocean Freight Companies List (Paginated)
**Endpoint:** `GET /api/OceanFreightCompanies`

**Query Parameters:**
- `pageNumber` (optional): number
- `pageSize` (optional): number
- `searchTerm` (optional): string
- `country` (optional): string
- `isActive` (optional): `true` | `false`

### 2. Get Ocean Freight Company by ID
**Endpoint:** `GET /api/OceanFreightCompanies/{id}`

### 3. Create Ocean Freight Company
**Endpoint:** `POST /api/OceanFreightCompanies`

**Request Body:**
```json
{
  "code": "OFC001",
  "companyName": "Global Ocean Shipping",
  "serviceType": "Container Shipping",
  "contactPerson": "David Lee",
  "email": "david@global.com",
  "phoneNumber": "+27123456789",
  "country": "South Africa",
  "address": "100 Port Road",
  "isActive": true
}
```

### 4. Update Ocean Freight Company
**Endpoint:** `PUT /api/OceanFreightCompanies/{id}`

### 5. Delete Ocean Freight Company
**Endpoint:** `DELETE /api/OceanFreightCompanies/{id}`

### 6. Check Code Exists
**Endpoint:** `GET /api/OceanFreightCompanies/check-code`

### 7. Get Summary
**Endpoint:** `GET /api/OceanFreightCompanies/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFreightCompanies": 25,
    "activeFreightCompanies": 22,
    "totalCountries": 4,
    "lastUpdatedDate": "2024-01-15T10:30:00Z",
    "lastUpdatedBy": "admin",
    "formattedLastUpdated": "2024-01-15 at 10:30 AM by admin"
  }
}
```

### 8. Export to Excel
**Endpoint:** `GET /api/OceanFreightCompanies/export/excel`

---

## 🚛 Local Transport Companies

### 1. Get Local Transport Companies List (Paginated)
**Endpoint:** `GET /api/LocalTransportCompanies`

**Query Parameters:**
- `pageNumber` (optional): number
- `pageSize` (optional): number
- `searchTerm` (optional): string
- `country` (optional): string
- `isActive` (optional): `true` | `false`

### 2. Get Local Transport Company by ID
**Endpoint:** `GET /api/LocalTransportCompanies/{id}`

### 3. Create Local Transport Company
**Endpoint:** `POST /api/LocalTransportCompanies`

**Request Body:**
```json
{
  "code": "LTC001",
  "companyName": "Fast Local Movers",
  "vatNumber": "VAT321654",
  "contactPerson": "Tom Williams",
  "email": "tom@fast.com",
  "phoneNumber": "+27123456789",
  "country": "South Africa",
  "address": "50 Transport Avenue",
  "serviceArea": "Gauteng Province",
  "vehicleTypes": "Trucks, Vans, Flatbeds",
  "isActive": true
}
```

### 4. Update Local Transport Company
**Endpoint:** `PUT /api/LocalTransportCompanies/{id}`

### 5. Delete Local Transport Company
**Endpoint:** `DELETE /api/LocalTransportCompanies/{id}`

### 6. Check Code Exists
**Endpoint:** `GET /api/LocalTransportCompanies/check-code`

### 7. Check VAT Number Exists
**Endpoint:** `GET /api/LocalTransportCompanies/check-vat`

### 8. Get Summary
**Endpoint:** `GET /api/LocalTransportCompanies/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransportCompanies": 35,
    "activeTransportCompanies": 30,
    "totalServiceAreas": 6,
    "lastUpdatedDate": "2024-01-15T10:30:00Z",
    "lastUpdatedBy": "admin",
    "formattedLastUpdated": "2024-01-15 at 10:30 AM by admin"
  }
}
```

### 9. Export to Excel
**Endpoint:** `GET /api/LocalTransportCompanies/export/excel`

---

## ⚓ Ports

### 1. Get Ports List (Paginated)
**Endpoint:** `GET /api/Ports`

**Query Parameters:**
- `pageNumber` (optional): number
- `pageSize` (optional): number
- `searchTerm` (optional): string
- `portType` (optional): string
- `isActive` (optional): `true` | `false`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "portId": 1,
        "portCode": "ZADUR",
        "portName": "Port of Durban",
        "country": "South Africa",
        "region": "KwaZulu-Natal",
        "portType": "Seaport",
        "description": "Largest container port in South Africa",
        "contactNumber": "+27313613111",
        "email": "durbanport@ports.co.za",
        "address": "1 Mahatma Gandhi Road, Durban",
        "remarks": "24/7 operations",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalRecords": 12,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

### 2. Get Port by ID
**Endpoint:** `GET /api/Ports/{id}`

### 3. Create Port
**Endpoint:** `POST /api/Ports`

**Request Body:**
```json
{
  "portCode": "ZACPT",
  "portName": "Port of Cape Town",
  "country": "South Africa",
  "region": "Western Cape",
  "portType": "Seaport",
  "description": "Major port in Western Cape",
  "contactNumber": "+27214495000",
  "email": "capetown@ports.co.za",
  "address": "Port of Cape Town, Cape Town",
  "isActive": true
}
```

### 4. Update Port
**Endpoint:** `PUT /api/Ports/{id}`

### 5. Delete Port
**Endpoint:** `DELETE /api/Ports/{id}`

### 6. Check Port Code Exists
**Endpoint:** `GET /api/Ports/check-code`

**Query Parameters:**
- `code` (required): string
- `excludeId` (optional): number

**Response:**
```json
{
  "exists": false
}
```

### 7. Get Ports Summary
**Endpoint:** `GET /api/Ports/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPorts": 12,
    "activePorts": 11,
    "totalCountries": 2,
    "totalPortTypes": 3,
    "lastUpdatedDate": "2024-01-15T10:30:00Z",
    "lastUpdatedBy": "admin",
    "formattedLastUpdated": "2024-01-15 at 10:30 AM by admin"
  }
}
```

### 8. Export Ports to Excel
**Endpoint:** `GET /api/Ports/export/excel`

**Query Parameters:**
- `searchTerm` (optional): string
- `portType` (optional): string
- `isActive` (optional): `true` | `false`

**Response:** Binary file (Excel format)

---

## 📦 Common Response Patterns

### Success Response Structure
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* actual data */ }
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "companyCode",
      "message": "Company code already exists"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Unauthorized Response (401)
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or expired token"
}
```

### Forbidden Response (403)
```json
{
  "success": false,
  "message": "Forbidden: You do not have permission to perform this action"
}
```

### Not Found Response (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

## 🔑 Important Implementation Notes

### 1. Authentication
- All endpoints (except `/api/Auth/login` and `/api/Auth/refresh-token`) require a valid JWT Bearer token
- Include `Authorization: Bearer {token}` header in all authenticated requests
- Tokens should expire after a reasonable time (e.g., 1 hour for access token, 7 days for refresh token)

### 2. CORS Configuration
- Enable CORS for the frontend origin
- Allow credentials in CORS policy
- Set appropriate CORS headers

### 3. Response Wrapping
- Frontend expects a consistent response structure with `success`, `message`, and `data` properties
- For paginated responses, include `totalRecords`, `currentPage`, `pageSize`, and `totalPages`
- Handle both direct data and wrapped data formats (frontend handles both)

### 4. Field Validation
- Validate all required fields before processing
- Return clear validation error messages
- Use appropriate HTTP status codes (400 for validation errors, 401 for auth, 404 for not found, etc.)

### 5. Soft Deletes
- Implement soft deletes where appropriate (set `isActive = false` instead of actual deletion)
- Allow filtering by `isActive` status in list endpoints

### 6. Audit Fields
- Include `createdAt`, `updatedAt`, `createdBy`, and `updatedBy` fields in all entities
- Automatically populate these fields on create/update operations
- Extract user information from JWT token for audit tracking

### 7. Excel Export
- Generate proper Excel files (.xlsx format)
- Include all relevant columns in exports
- Apply filters from query parameters
- Set proper headers for file download

### 8. Case Sensitivity
- Handle case-insensitive searches in `searchTerm` parameters
- Check for duplicates in a case-insensitive manner (e.g., company codes, emails)

### 9. Pagination
- Default page size: 10
- Maximum page size: 100
- Always return pagination metadata in list responses

### 10. Error Handling
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors server-side for debugging
- Don't expose sensitive information in error messages

---

## 🚨 CRITICAL NEW ENDPOINT

### Bulk Save Role Claims
**Endpoint:** `POST /api/Roles/{roleId}/claims/bulk`

This is the **MOST IMPORTANT** new endpoint to implement. The frontend now uses this endpoint to save all selected claims for a role in a single transaction instead of making multiple individual API calls.

**Why it's critical:**
- Performance: Single transaction instead of N API calls
- Data integrity: Atomic operation ensures all-or-nothing update
- User experience: Faster save with single loading state
- Simplicity: Frontend sends complete list of selected claim keys

**Implementation Algorithm:**
```
1. Start database transaction
2. Get all existing RoleClaims for roleId
3. Mark all existing RoleClaims as isActive = false
4. For each claimKey in request.claimKeys:
   a. Check if RoleClaim exists (roleId + claimType match)
   b. If exists: Update isActive = true
   c. If not exists: Insert new RoleClaim with isActive = true
5. Commit transaction
6. Return success with statistics (added, removed, total)
```

---

## 📝 Testing Checklist

For each endpoint, test:
- ✅ Success case with valid data
- ✅ Missing required fields
- ✅ Invalid data types
- ✅ Duplicate checks (codes, emails, etc.)
- ✅ Unauthorized access (missing/invalid token)
- ✅ Forbidden access (user without permission)
- ✅ Not found cases (invalid IDs)
- ✅ Pagination edge cases (page 0, negative, beyond total pages)
- ✅ Search with special characters
- ✅ Filter combinations

---

## 📞 Questions or Issues?

If you need clarification on any endpoint or response structure, please reach out. The frontend is built to handle various response formats, but consistency makes integration easier.

**Frontend Repository:** [Provide link if available]
**API Base URL:** [To be configured in .env file]

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Prepared by:** Frontend Team
