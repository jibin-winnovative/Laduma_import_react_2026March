# S3 Upload CORS Troubleshooting Guide

## Problem
S3 presigned URL works in Postman but fails in browser (CORS error)

## CONFIRMED ISSUE
**Bucket**: `laduma-import-attachments`
**Region**: `me-south-1`
**Error**: No 'Access-Control-Allow-Origin' header is present on the requested resource

✅ **Good News**: The presigned URL is correctly generated with Content-Type in the signature
❌ **Problem**: S3 bucket lacks CORS configuration

## Common Causes & Solutions

### 1. Content-Type Header Mismatch
**Problem**: The headers sent from browser must EXACTLY match what was signed in the presigned URL.

**Backend Fix Required**:
```csharp
// When generating presigned URL, include Content-Type in the request
var request = new GetPreSignedUrlRequest
{
    BucketName = bucketName,
    Key = key,
    Verb = HttpVerb.PUT,
    Expires = DateTime.UtcNow.AddMinutes(15),
    ContentType = contentType  // ← MUST include this
};
```

### 2. S3 Bucket CORS Configuration (REQUIRED FIX)
**Backend Fix Required**: Configure CORS on `laduma-import-attachments` bucket

#### Option A: AWS Console (Easiest)
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/buckets)
2. Select bucket: `laduma-import-attachments`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste the configuration from `S3_BUCKET_CORS_CONFIG.json`
7. Click **Save changes**

#### Option B: AWS CLI
```bash
aws s3api put-bucket-cors \
  --bucket laduma-import-attachments \
  --cors-configuration file://S3_BUCKET_CORS_CONFIG.json \
  --region me-south-1
```

#### Option C: Backend Code (C#/.NET)
```csharp
var corsConfiguration = new CORSConfiguration
{
    Rules = new List<CORSRule>
    {
        new CORSRule
        {
            AllowedHeaders = new List<string> { "*" },
            AllowedMethods = new List<string> { "GET", "PUT", "POST", "DELETE", "HEAD" },
            AllowedOrigins = new List<string> { "*" },
            ExposeHeaders = new List<string> { "ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2" },
            MaxAgeSeconds = 3000
        }
    }
};

await s3Client.PutCORSConfigurationAsync(new PutCORSConfigurationRequest
{
    BucketName = "laduma-import-attachments",
    Configuration = corsConfiguration
});
```

**CORS Configuration**: See `S3_BUCKET_CORS_CONFIG.json` for the exact JSON

### 3. Browser vs Postman Differences

**Why Postman works but browser doesn't:**
- Postman doesn't enforce CORS policies
- Browsers send preflight OPTIONS requests
- Browsers include additional headers (Origin, Referer, etc.)
- Browser security policies are stricter

### 4. Frontend Implementation (Current)

```typescript
// Using XMLHttpRequest for better S3 compatibility
xhr.open('PUT', uploadUrl, true);
xhr.setRequestHeader('Content-Type', file.type); // Must match backend signature
xhr.send(file);
```

## Debugging Steps

1. **Check Browser Console**: Look for CORS error messages
2. **Check Network Tab**:
   - Look for failed OPTIONS (preflight) requests
   - Check response headers for CORS headers
3. **Verify Presigned URL**: Should include Content-Type in query params if signed
4. **Check S3 Bucket**: Verify CORS configuration in AWS Console

## Expected Console Output (Success)

```
📝 Requesting presigned upload: { fileName: "test.pdf", contentType: "application/pdf", ... }
✅ Received presigned upload response: { attachmentId: 123, ... }
🔄 Attempting S3 upload via XMLHttpRequest...
✅ S3 upload successful via XMLHttpRequest
```

## Expected Console Output (CORS Error)

```
📝 Requesting presigned upload: { fileName: "test.pdf", contentType: "application/pdf", ... }
✅ Received presigned upload response: { attachmentId: 123, ... }
🔄 Attempting S3 upload via XMLHttpRequest...
❌ S3 Upload network error: { status: 0, statusText: "" }
```

**Status 0 = CORS error**

## Backend Checklist

- [ ] S3 bucket has CORS policy configured
- [ ] Presigned URL includes Content-Type in signature
- [ ] Presigned URL expiration is sufficient (15+ minutes recommended)
- [ ] S3 bucket permissions allow public uploads via presigned URLs
- [ ] Backend returns correct uploadUrl format

## Testing

1. Open browser console
2. Try uploading a file
3. Check console logs for detailed error information
4. Share error details with backend team if CORS-related
