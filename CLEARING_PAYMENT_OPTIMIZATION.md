# Clearing Payment Form Optimization

## Problem
In edit mode, the Clearing Payment form was making unnecessary API calls:
1. `api/containers/search` - to load all containers
2. `api/containers/{id}/purchase-orders` - to load POs for the container
3. `api/clearing-payments/{id}` - which already returns all the data

This caused:
- Multiple redundant API calls on page load
- Race conditions with the clearing agent dropdown
- Slower page load times

## Solution
Optimized the component to use data from the single `getById` API call, which returns:
```json
{
  "clearingPaymentId": 1,
  "containerId": 1,
  "containerNumber": "CA-5345",
  "clearingAgentId": 1002,
  "clearingAgentName": "Backstage Library Works",
  "paymentDate": "2026-03-17T00:00:00",
  "billDate": "2026-03-19T00:00:00",
  "clearingAmount": 12580.00,
  "status": "Draft",
  "pOs": [...]
}
```

## Changes Made

### 1. Consolidated useEffect hooks
- Combined two separate useEffect hooks into one
- Edit mode only loads what's needed
- Add mode loads dropdowns normally

### 2. Optimized loadExisting function
- Loads clearing payment data and agents in parallel
- Uses containerNumber from API response instead of fetching all containers
- Extracts POs directly from API response instead of making separate call

### 3. Created loadFromAPIData helper
- Parses the API response data
- Handles both response formats (pOs/purchaseOrders, charges/chargeLines)
- Populates PO list and charge map from existing data

### 4. Updated TypeScript types
- Added support for both API response formats
- Added missing fields (poDate, supplierId, totalCBM)
- Made fields optional to handle different response structures

## Result
**Before:** 3 API calls on edit mode load
- `api/containers/search`
- `api/clearing-agents` (with race condition)
- `api/clearing-payments/{id}`
- `api/containers/{id}/purchase-orders`

**After:** 2 API calls on edit mode load (in parallel)
- `api/clearing-payments/{id}` (contains all data)
- `api/clearing-agents` (no race condition)

**Benefits:**
- 50% reduction in API calls
- Eliminated race condition with clearing agent dropdown
- Faster page load
- Better user experience
