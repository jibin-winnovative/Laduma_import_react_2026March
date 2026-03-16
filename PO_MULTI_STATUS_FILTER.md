# Purchase Order Multi-Status Filter Feature

## Summary
Replaced single status dropdown with a multi-select component allowing users to filter purchase orders by multiple statuses simultaneously.

## Changes Made

### 1. Created MultiSelect Component (`src/components/ui/MultiSelect.tsx`)
A reusable multi-select dropdown component with:
- **Visual Tags**: Selected values displayed as removable tags
- **Dropdown List**: Click-to-toggle selection with checkmark indicators
- **Click Outside**: Auto-closes when clicking outside the component
- **Dark Mode Support**: Full dark mode styling
- **Keyboard Accessible**: Remove tags with X button

### 2. Updated PurchaseOrdersService (`src/services/purchaseOrdersService.ts`)

#### Interface Changes
```typescript
export interface PurchaseOrderListParams {
  companyId?: number;          // Made optional
  statuses?: string[];         // Added for multiple status filtering
  // ... other params
}
```

#### API Call Changes
- Modified `getList()` to build URL query parameters manually
- Sends multiple status values using repeated query parameters
- Format: `?statuses=Draft&statuses=Approved&statuses=Submitted`

### 3. Updated PurchaseOrderList Component (`src/pages/Purchase/PurchaseOrderList.tsx`)

#### State Changes
```typescript
// Before
const [selectedStatus, setSelectedStatus] = useState('');

// After
const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
  'Draft', 'Approved', 'Submitted', 'Rejected'
]);
```

#### Status Options
Updated from array of strings to array of objects:
```typescript
const statusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'PartiallyReceived', label: 'Partially Received' },
  { value: 'Received', label: 'Received' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rejected', label: 'Rejected' },
];
```

#### Default Selection
By default, the following statuses are selected:
- Draft
- Approved
- Submitted
- Rejected

#### API Integration
```typescript
if (selectedStatuses && selectedStatuses.length > 0) {
  params.statuses = selectedStatuses;
}
```

## API Request Format

### Example Request URL
```
GET /api/purchaseorders?
  pageNumber=1&
  pageSize=10&
  companyId=1&
  statuses=Draft&
  statuses=Approved&
  statuses=Submitted&
  statuses=Rejected
```

### ASP.NET Binding
The repeated `statuses` query parameters are automatically bound to:
```csharp
List<string> { "Draft", "Approved", "Submitted", "Rejected" }
```

## Valid Status Values

The following status values match the backend POStatus enum:
- **Draft**: Initial state when PO is created
- **Submitted**: Submitted for approval
- **Approved**: Approved and confirmed
- **Rejected**: Rejected by approver
- **Shipped**: In transit
- **PartiallyReceived**: Some items received
- **Received**: All items received
- **Completed**: Order completed

Status values are case-insensitive on the backend.

## User Experience

### Multi-Select Interaction
1. **Click to Open**: Click the multi-select field to open dropdown
2. **Select/Deselect**: Click any status to toggle selection
3. **Visual Feedback**: Selected items show checkmark and highlight
4. **Remove Tags**: Click X on any tag to remove that status
5. **Auto-Close**: Dropdown closes when clicking outside

### Search Behavior
- User selects desired statuses from dropdown
- Clicks "Search" button to apply filters
- Results show only POs matching selected statuses
- Empty selection shows all POs (no status filter)

### Reset Behavior
- Clicking "Reset" button resets statuses to default:
  - Draft
  - Approved
  - Submitted
  - Rejected

## Technical Notes

### URL Parameter Building
Using `URLSearchParams` to build the query string correctly:
```typescript
const urlParams = new URLSearchParams();
if (params.statuses && params.statuses.length > 0) {
  params.statuses.forEach(status => urlParams.append('statuses', status));
}
```

### Avoiding Axios Serialization Issues
- Not using Axios `params` option for arrays
- Manually building query string to ensure correct format
- Backend expects repeated parameters, not JSON array

## Benefits

1. **Flexible Filtering**: View multiple PO statuses at once
2. **Better Workflow**: Default selection covers active PO states
3. **User Friendly**: Visual tags make selection clear
4. **Efficient**: Single API call for multiple statuses
5. **Standard HTTP**: Uses standard query parameter format
