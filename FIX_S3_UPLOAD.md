# How to Fix S3 Upload CORS Error

## The Problem
File uploads fail with: **"No 'Access-Control-Allow-Origin' header is present"**

## The Solution
The S3 bucket `laduma-import-attachments` needs CORS configuration.

---

## For Backend Team / DevOps txt

### Quick Fix (AWS Console) - 2 minutes

1. Open AWS Console and go to S3
2. Find bucket: **laduma-import-attachments** (region: me-south-1)
3. Click **Permissions** tab
4. Find **Cross-origin resource sharing (CORS)** section
5. Click **Edit**
6. Copy and paste this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

7. Click **Save changes**
8. Done! File uploads will work immediately

### Alternative: AWS CLI

```bash
aws s3api put-bucket-cors \
  --bucket laduma-import-attachments \
  --cors-configuration file://S3_BUCKET_CORS_CONFIG.json \
  --region me-south-1
```

---

## Why This Happens

- ✅ **Postman works** - Doesn't enforce CORS
- ❌ **Browser fails** - Browsers enforce CORS for security
- 🔧 **Fix needed** - S3 bucket must allow cross-origin requests

## Verification

After applying CORS configuration:
1. Try uploading a file in the app
2. Check browser console - should show: ✅ **S3 upload successful via XMLHttpRequest**
3. No more CORS errors

## Security Note

The current configuration uses `"AllowedOrigins": ["*"]` for development.

**For production**, replace `"*"` with your specific domain:
```json
"AllowedOrigins": ["https://yourdomain.com"]
```
