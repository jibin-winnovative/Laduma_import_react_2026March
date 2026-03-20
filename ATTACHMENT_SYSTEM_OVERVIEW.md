# Purchase Order Attachment System - Complete Overview

## Summary

The Purchase Order module implements a comprehensive attachment management system with presigned S3 URLs, automatic retry logic, progress tracking, and support for both new uploads and existing attachment management.

## Architecture Components

### 1. **Attachment Service** (`src/services/attachmentService.ts`)

The service handles all attachment-related API calls and S3 operations:

#### Core Functions:
- **`requestPresignedUpload()`**: Requests a presigned URL from the backend for uploading to S3
- **`uploadToS3()`**: Uploads file directly to S3 using presigned URL via XMLHttpRequest
- **`confirmUpload()`**: Confirms successful upload to the backend
- **`getByEntity()`**: Retrieves all attachments for a specific entity (e.g., PurchaseOrder)
- **`delete()`**: Deletes an attachment from both backend and S3
- **`getDownloadUrl()`**: Gets a presigned download URL for viewing/downloading files

#### Upload Process (3-Step):
1. **Request presigned URL** - Backend creates a record and returns S3 presigned URL
2. **Upload to S3** - File is uploaded directly to S3 bucket using PUT request
3. **Confirm upload** - Backend marks the attachment as confirmed

### 2. **Create/Edit Purchase Order** (`src/pages/Purchase/PurchaseOrderForm.tsx`)

#### State Management:

```typescript
interface PendingAttachment {
  id: string;                    // Temporary client-side ID
  type: string;                  // Document type (Proforma Invoice, etc.)
  file: File;                    // The actual file object
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress: number;              // Upload progress (0-100)
  error?: string;                // Error message if failed
  retryCount?: number;           // Number of retry attempts
}

interface ExistingAttachment {
  attachmentId: number;          // Backend attachment ID
  fileName: string;
  fileSize: number;
  contentType: string;
  fileUrl: string;
  entityType: string;
  entityId: number;
}
```

Two separate states:
- **`pendingAttachments`**: Files selected for upload but not yet saved to backend
- **`existingAttachments`**: Files already uploaded and confirmed in the database

#### Upload Flow (Create/Edit Mode):

1. **File Selection**:
   ```typescript
   // User selects files via file input
   <input type="file" multiple accept=".pdf,.doc,.docx,..." />

   // Files are added to pendingAttachments with empty type
   addAttachment('', file);
   ```

2. **Type Selection**:
   - User must select a document type for each file:
     - Proforma Invoice
     - Initial Deposit POP
     - Bill of Lading
     - Commercial Invoice
     - Packing List
     - Master Bill of Lading (MBL)
     - Balance Payment POP
     - Telex Release
     - CA Invoice

3. **Validation Before Submit**:
   ```typescript
   // All attachments must have a type selected
   const missingTypes = pendingAttachments.some(att => !att.type);
   if (missingTypes) {
     alert('Please select a type for all attachments');
     return;
   }
   ```

4. **Submit Process**:
   - Purchase Order is created/updated first
   - Then attachments are uploaded using the PO ID
   - Each upload happens sequentially (one at a time)

5. **Upload with Retry Logic**:
   ```typescript
   uploadSingleAttachment(index, attachment, entityId) {
     MAX_RETRIES = 3;

     while (currentRetry <= MAX_RETRIES) {
       try {
         // Step 1: Get presigned URL (progress: 10%)
         presignedResponse = await requestPresignedUpload({
           fileName, contentType,
           entityType: 'PurchaseOrder',
           entityId
         });

         // Step 2: Upload to S3 (progress: 40%)
         await uploadToS3(uploadUrl, file);

         // Step 3: Confirm upload (progress: 70%)
         await confirmUpload(attachmentId);

         // Success! (progress: 100%)
         status = 'uploaded';
         return true;

       } catch (error) {
         currentRetry++;
         if (currentRetry <= MAX_RETRIES) {
           // Wait before retry (1s, 2s, 3s)
           await sleep(1000 * currentRetry);
           continue;
         } else {
           status = 'failed';
           error = 'Upload failed after 3 retries';
           return false;
         }
       }
     }
   }
   ```

6. **Progress Indication**:
   - Visual progress bar shows upload status
   - Status indicators: Pending, Uploading, Uploaded, Failed
   - Retry count displayed during retries
   - Failed uploads can be manually retried

7. **Managing Existing Attachments** (Edit Mode Only):
   - Displayed in "Existing Attachments" section
   - Can download any existing attachment
   - Can delete existing attachments
   - Deletion requires confirmation and immediately removes from backend

#### UI Components:

**Upload Area**:
```tsx
<input type="file" multiple accept="..." />
<label>
  Click to upload or drag and drop
  PDF, DOC, XLS, PNG, JPG (Max 10MB per file)
</label>
```

**Existing Attachments** (Edit mode):
```tsx
{existingAttachments.map(attachment => (
  <div>
    <FileText icon />
    <span>{attachment.fileName}</span>
    <button onClick={downloadAttachment}>Download</button>
    <button onClick={removeAttachment}>Delete</button>
  </div>
))}
```

**Pending Attachments**:
```tsx
{pendingAttachments.map(attachment => (
  <div>
    <FileText icon />
    <span>{attachment.file.name}</span>
    <span>{attachment.file.size} KB</span>

    <select value={attachment.type} onChange={updateType}>
      <option value="">Select Type</option>
      <option value="Proforma Invoice">...</option>
      ...
    </select>

    {attachment.status === 'pending' && <p>Pending upload</p>}

    {attachment.status === 'uploading' && (
      <div>
        <p>Uploading (Retry {retryCount})...</p>
        <progress value={attachment.progress} />
      </div>
    )}

    {attachment.status === 'uploaded' && <p>✓ Uploaded</p>}

    {attachment.status === 'failed' && (
      <div>
        <p>✗ {attachment.error}</p>
        <button onClick={retryUpload}>Retry</button>
      </div>
    )}

    <button onClick={removePending}>Delete</button>
  </div>
))}
```

**Submit Button Behavior**:
- Disabled while uploading attachments
- Shows "Uploading attachments..." during upload
- Regular submit text when ready

### 3. **View Purchase Order** (`src/pages/Purchase/ViewPurchaseOrder.tsx`)

#### View Mode Features:

**Read-Only Display**:
- Shows all attachments in a card section
- Only displayed if attachments exist (length > 0)
- Clean grid layout with file icons

**Actions Available**:
1. **Download**: Downloads the file to user's computer
2. **View**: Opens the file in a new browser tab (for PDFs, images)

```typescript
handleDownload(attachmentId, fileName) {
  // Get presigned download URL
  downloadUrl = await attachmentService.getDownloadUrl(
    attachmentId,
    60,      // expires in 60 minutes
    false    // isView = false for download
  );

  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
}

handleView(attachmentId) {
  // Get presigned view URL
  viewUrl = await attachmentService.getDownloadUrl(
    attachmentId,
    60,     // expires in 60 minutes
    true    // isView = true for inline display
  );

  // Open in new tab
  window.open(viewUrl, '_blank');
}
```

**UI Structure**:
```tsx
{purchaseOrder.attachments.length > 0 && (
  <Card>
    <h3>Attachments</h3>
    <div className="grid">
      {purchaseOrder.attachments.map(attachment => (
        <div className="flex items-center justify-between">
          <div>
            <FileText icon />
            <span>{attachment.fileName}</span>
          </div>
          <div>
            <Button onClick={handleDownload}>
              <Download icon /> Download
            </Button>
            <Button onClick={handleView}>
              <ExternalLink icon /> View
            </Button>
          </div>
        </div>
      ))}
    </div>
  </Card>
)}
```

## Key Features

### ✅ Robust Upload System
- **3-step upload process** with confirmation
- **Automatic retry logic** with exponential backoff (3 retries)
- **Progress tracking** with visual indicators
- **Manual retry** for failed uploads
- **Sequential uploads** to prevent overwhelming the server

### ✅ File Type Management
- **Required type selection** before upload
- **9 predefined document types** specific to purchase orders
- **Type validation** prevents submission without types

### ✅ Dual State Management
- **Pending attachments**: Files waiting to be uploaded
- **Existing attachments**: Already saved files (edit mode)
- **Clear separation** between new and existing files

### ✅ User Experience
- **File size display** in KB
- **Visual status indicators** (pending, uploading, uploaded, failed)
- **Progress bars** during upload
- **Retry counters** showing attempt numbers
- **Error messages** with actionable information
- **Confirmation dialogs** for deletions

### ✅ Security & Performance
- **Presigned URLs** for direct S3 uploads (no backend bottleneck)
- **Time-limited URLs** (expire after 60 minutes)
- **XMLHttpRequest** for reliable uploads
- **Content-Type validation** on both client and server
- **Authorization checks** on backend

## Error Handling

### Upload Failures:
1. **Network errors**: Automatic retry with backoff
2. **S3 errors**: Caught and retried
3. **Backend errors**: Displayed to user
4. **Type validation**: Prevents submission
5. **Max retries exceeded**: Manual retry button appears

### User Notifications:
- **Success**: "Purchase Order saved with X attachments"
- **Partial failure**: "PO saved, but X attachments failed. Retry or upload later"
- **Complete failure**: Error message with details

## File Type Support

**Accepted formats**: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.png`, `.jpg`, `.jpeg`

**Max file size**: 10MB per file (frontend enforced)

## Document Types

The system supports these purchase order document types:
1. Proforma Invoice
2. Initial Deposit POP (Proof of Payment)
3. Bill of Lading
4. Commercial Invoice
5. Packing List
6. Master Bill of Lading (MBL)
7. Balance Payment POP
8. Telex Release
9. CA Invoice (Clearing Agent Invoice)

## Technical Details

### Backend Integration:
- **Entity Type**: `PurchaseOrder`
- **Entity ID**: Purchase Order ID from backend
- **API Endpoints**:
  - `POST /api/Attachments/presigned-upload` - Request upload URL
  - `POST /api/Attachments/{id}/confirm` - Confirm upload
  - `GET /api/Attachments/entity/{type}/{id}` - Get attachments
  - `DELETE /api/Attachments/{id}` - Delete attachment
  - `GET /api/Attachments/{id}/presigned-download` - Get download URL

### S3 Upload:
- **Method**: PUT request with file binary
- **Headers**: Content-Type must match file type
- **Direct upload**: Client → S3 (no backend proxy)
- **Presigned**: Backend generates temporary signed URL

## Workflow Summary

### Create New PO with Attachments:
1. Fill PO form
2. Click upload area to select files
3. Select document type for each file
4. Click "Submit for Approval" or "Save as Draft"
5. PO is created in backend
6. Attachments upload sequentially
7. Success/failure notification
8. Form closes on success

### Edit Existing PO:
1. Open PO in edit mode
2. View existing attachments (download/delete)
3. Optionally add new files
4. Select types for new files
5. Click "Update & Submit" or "Save Changes"
6. PO updates in backend
7. New attachments upload
8. Success notification

### View PO:
1. Open PO in view mode
2. See all attachments
3. Download any file
4. View files in browser (PDFs, images)

## Benefits

✅ **Resilient**: Automatic retries handle temporary failures
✅ **User-friendly**: Clear progress and status feedback
✅ **Efficient**: Direct S3 uploads, no backend bottleneck
✅ **Secure**: Presigned URLs with expiration
✅ **Flexible**: Support for multiple file types
✅ **Organized**: Document type categorization
✅ **Recoverable**: Manual retry for failed uploads
