# Purchase Order Delete Feature

## Summary
Added delete functionality for Purchase Orders with "Draft" or "Rejected" status in the edit form.

## Changes Made

### 1. Updated PurchaseOrderForm.tsx
- Added `Trash` icon import from lucide-react
- Added `showDeleteDialog` state to manage delete confirmation dialog
- Added `canDelete` flag that evaluates to true when:
  - Mode is 'edit' AND
  - Status is either 'Draft' OR 'Rejected'

### 2. Delete Functionality
- **Handler**: `handleDelete()` - Opens confirmation dialog
- **Confirmation**: `confirmDelete()` - Calls API to delete purchase order
- **API Call**: Uses existing `purchaseOrdersService.delete(id)` method
- **API Endpoint**: `DELETE /api/PurchaseOrders/{id}`

### 3. UI Changes

#### Delete Button Location
- Positioned on the left side of the footer (opposite to Cancel/Save buttons)
- Only visible when `canDelete` is true (Draft or Rejected status in edit mode)
- Red styling with trash icon
- Disabled during loading state

#### Confirmation Dialog
- Modal dialog with warning message
- Clear confirmation required before deletion
- Cannot be undone warning
- Two options: Cancel or Yes, Delete

## User Flow
1. User opens a Purchase Order in edit mode with "Draft" or "Rejected" status
2. Delete button appears on the left side of the form footer
3. User clicks Delete button
4. Confirmation dialog appears asking for confirmation
5. User confirms deletion
6. API call is made to delete the purchase order
7. Success message shown
8. Form closes and parent component refreshes (via onSuccess callback)

## Status-Based Button Visibility

### Draft Status
- Delete button: ✓ Visible
- Save Draft: ✓ Visible
- Submit for Approval: ✓ Visible

### Rejected Status
- Delete button: ✓ Visible
- Save Draft: ✓ Visible
- Submit for Approval: ✓ Visible

### Submitted Status
- Delete button: ✗ Hidden
- Reject: ✓ Visible
- Save and Approve: ✓ Visible

### Approved Status
- Delete button: ✗ Hidden
- Save and Approve: ✓ Visible

## Error Handling
- Try-catch block wraps delete API call
- Loading state shown during deletion
- Error messages displayed via alert
- Form remains open on error
- Form closes only on successful deletion
