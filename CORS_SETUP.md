# CORS Configuration Guide

## Problem
The login shows a network error because your .NET API is blocking requests from the frontend due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution

### Step 1: Find Your Frontend Origin

Open the browser console (F12) and look for this message:
```
📋 Add this origin to your .NET API CORS settings: https://xxxxx.webcontainer.io
```

Copy that URL - this is what you need to whitelist.

### Step 2: Update Your .NET API

In your .NET API project, update the CORS configuration:

#### Option A: Quick Fix (Development Only)

In `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add CORS - ALLOW ALL (Development only!)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// Use CORS before other middleware
app.UseCors("AllowAll");

// Rest of your middleware...
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### Option B: Production-Ready Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add CORS with specific origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(
                    "https://stackblitz.io",
                    "https://*.webcontainer.io",  // Bolt.new domains
                    "http://localhost:5173",       // Local Vite dev server
                    "http://localhost:3000",       // Alternative local port
                    "YOUR_PRODUCTION_DOMAIN_HERE"
                  )
                  .SetIsOriginAllowedToAllowWildcardSubdomains() // Allow *.webcontainer.io
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();  // Important if using cookies
        });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Rest of your middleware...
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### Option C: Configuration from appsettings.json

`appsettings.json`:
```json
{
  "AllowedOrigins": [
    "https://stackblitz.io",
    "https://*.webcontainer.io",
    "http://localhost:5173"
  ]
}
```

`Program.cs`:
```csharp
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ConfiguredOrigins",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

app.UseCors("ConfiguredOrigins");
```

### Step 3: Common Bolt.new Origins

If you can't see the console message, these are the most common Bolt.new origins:

```
https://stackblitz.io
https://*.webcontainer.io
https://webcontainer.io
```

Add ALL of these to be safe.

### Step 4: Verify CORS Headers

After updating your API, it should return these headers:

```
Access-Control-Allow-Origin: https://xxxxx.webcontainer.io
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Testing CORS

### Using curl:
```bash
curl -H "Origin: https://xxxxx.webcontainer.io" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-api-url.com/api/Auth/login -v
```

Should return `200 OK` with CORS headers.

## Common Issues

### Issue 1: 403 Forbidden
**Cause**: ngrok may be blocking requests
**Solution**: Add ngrok authentication bypass or upgrade ngrok plan

### Issue 2: No CORS headers in response
**Cause**: CORS middleware not configured correctly
**Solution**: Ensure `app.UseCors()` is called BEFORE `UseAuthentication()` and `UseAuthorization()`

### Issue 3: Credentials error
**Cause**: Using `AllowCredentials()` with `AllowAnyOrigin()`
**Solution**: Use `WithOrigins()` instead of `AllowAnyOrigin()` when using credentials

## ngrok Specific Configuration

If using ngrok, you may need to:

1. **Disable ngrok browser warning**:
```bash
ngrok http 5000 --host-header="localhost:5000"
```

2. **Add ngrok-skip-browser-warning header** (already added in the frontend):
```typescript
headers: {
  'ngrok-skip-browser-warning': 'true'
}
```

## Middleware Order

**IMPORTANT**: Middleware order matters in .NET!

```csharp
app.UseCors("YourPolicy");        // ← FIRST
app.UseAuthentication();           // ← THEN
app.UseAuthorization();            // ← THEN
app.MapControllers();              // ← LAST
```

## Quick Checklist

- [ ] CORS policy configured in Program.cs
- [ ] Correct origin added (check browser console)
- [ ] `app.UseCors()` called before authentication
- [ ] API restarted after changes
- [ ] ngrok session is active (if using ngrok)
- [ ] No firewall blocking requests

## Still Not Working?

Check browser console for specific error:
- "CORS policy: No 'Access-Control-Allow-Origin' header" → CORS not configured
- "Network Error" → API not reachable
- "403 Forbidden" → ngrok or server blocking request
- "401 Unauthorized" → CORS working, but auth issue
