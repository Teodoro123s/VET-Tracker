# Deploy Firebase Storage Rules

To fix the "storage/unauthorized" error, you need to deploy the storage rules to Firebase:

## Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Storage → Rules
4. Replace the existing rules with the content from `storage.rules`
5. Click "Publish"

## Option 2: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init storage

# Deploy storage rules
firebase deploy --only storage
```

## Current Rules Content
Copy this into Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload payment proofs
    match /payment-proofs/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Default rule for other paths
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```