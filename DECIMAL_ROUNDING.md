# Decimal Rounding Implementation

## Summary
All decimal values in Purchase Order create, edit, and view windows are now rounded to 2 decimal places.

## Changes Made

### 1. Created Utility Function
- **File**: `src/utils/numberUtils.ts`
- Added `roundToTwoDecimals()` function to consistently round numbers to 2 decimal places
- Used throughout the application for price, amount, CBM, and percentage calculations

### 2. Updated PurchaseOrderForm.tsx
All decimal calculations now use `roundToTwoDecimals()`:

- **Item Calculations**:
  - Unit price (priceUSD)
  - Line total amount
  - CBM and Total CBM

- **Charges**:
  - Addon charge amounts

- **Payment Terms**:
  - Percentage values
  - Expected amount calculations

- **Input Handlers**:
  - Price input field
  - Amount input field
  - Charge amount input
  - Payment percentage and amount inputs

- **Data Loading**:
  - When loading existing purchase orders
  - When adding products from product search
  - When fetching supplier payment terms

### 3. Updated ViewPurchaseOrder.tsx
- Changed CBM display from 4 decimals to 2 decimals
- Changed Total CBM display from 4 decimals to 2 decimals
- Weight display already uses 2 decimals (no change needed)
- All currency amounts already use 2 decimals via `formatCurrency()` function

## Affected Fields
All the following fields now display and calculate with 2 decimal precision:
- Unit Price Foreign
- Line Total Foreign
- CBM (Cubic Meters)
- Total CBM
- Addon Charge Amounts
- Payment Percentage
- Payment Expected Amount
- Subtotals
- Grand Totals

## Testing Recommendations
1. Create a new purchase order and verify all calculations round to 2 decimals
2. Edit an existing purchase order and verify values are properly rounded
3. View a purchase order and verify all displayed amounts show 2 decimal places
4. Test edge cases like:
   - Dividing amounts that result in many decimal places
   - Multiplying quantities by prices with decimals
   - Payment percentage calculations
