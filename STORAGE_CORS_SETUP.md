# Firebase Storage CORS Configuration

## Problem
When uploading files to Firebase Storage from localhost, you may encounter CORS errors:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy
```

## Solution
Configure Firebase Storage to allow requests from localhost.

### Prerequisites
- Install Google Cloud SDK (gcloud CLI): https://cloud.google.com/sdk/docs/install
- Or use Google Cloud Shell (no installation needed)

### Steps

#### Option 1: Using gcloud CLI (Recommended)

1. **Install Google Cloud SDK** if you haven't already:
   - Windows: Download from https://cloud.google.com/sdk/docs/install
   - Mac: `brew install --cask google-cloud-sdk`
   - Linux: Follow instructions at https://cloud.google.com/sdk/docs/install

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project vet-management-b322c
   ```

4. **Apply the CORS configuration**:
   ```bash
   gcloud storage buckets update gs://vet-management-b322c.firebasestorage.app --cors-file=storage-cors.json
   ```

   Or use gsutil (older method):
   ```bash
   gsutil cors set storage-cors.json gs://vet-management-b322c.firebasestorage.app
   ```

#### Option 2: Using Google Cloud Console (Web UI)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `vet-management-b322c`
3. Navigate to **Cloud Storage** → **Buckets**
4. Click on `vet-management-b322c.appspot.com`
5. Go to the **Configuration** tab
6. Under **CORS**, add the following:
   ```json
   [
     {
       "origin": ["http://localhost:8081", "http://localhost:8082", "http://localhost:19006"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
7. Click **Save**

#### Option 3: Using Cloud Shell (No Installation)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **Cloud Shell** icon (>_) in the top right
3. Upload `storage-cors.json` using the upload button
4. Run:
   ```bash
   gcloud storage buckets update gs://vet-management-b322c.appspot.com --cors-file=storage-cors.json
   ```

### Verify Configuration

After applying, you can verify the CORS configuration:

```bash
gcloud storage buckets describe gs://vet-management-b322c.appspot.com --format="default(cors)"
```

Or with gsutil:
```bash
gsutil cors get gs://vet-management-b322c.appspot.com
```

### Testing

1. Restart your Expo dev server:
   ```bash
   npx expo start --web --clear
   ```

2. Try uploading an image again - the CORS error should be gone!

### Production Configuration

For production, update the `storage-cors.json` file to include your production domain:

```json
[
  {
    "origin": ["https://yourdomain.com", "https://www.yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Then reapply the configuration using the same command.

### Troubleshooting

- **Permission Denied**: Make sure you're logged in with an account that has Storage Admin permissions
- **Bucket Not Found**: Verify the bucket name matches your Firebase project
- **Still Getting CORS Error**: 
  - Clear your browser cache
  - Wait a few minutes for the configuration to propagate
  - Check that the origin in the CORS config matches exactly (including port)
  - Ensure you're using the correct bucket (should be `PROJECT_ID.appspot.com`)

### Security Note

The `storage-cors.json` file includes localhost URLs for development. In production:
- Remove localhost URLs
- Add only your production domain(s)
- Consider using Firebase Storage Rules for additional security
