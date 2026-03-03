# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up and use Firebase Cloud Messaging for push notifications in the FSM backend.

## 📋 Overview

FCM allows users to receive push notifications even when they're **not logged in** or when the app is **closed**. This is essential for important notifications like task assignments, chat messages, and project updates.

## 🔧 Backend Setup

### 1. Install Dependencies

Already installed: `firebase-admin`

### 2. Configure Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file to your project root (e.g., `firebase-service-account.json`)
6. **Important:** Add this file to `.gitignore` to keep it secure:

```gitignore
firebase-service-account.json
.env
```

### 3. Environment Variables

Add to your `.env` file:

```env
# Firebase Configuration (Required)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

## 📱 Frontend Setup

### 1. Register FCM Token

When the app starts or user opens the app, register their FCM token:

```javascript
// Get FCM token from Firebase SDK
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
const fcmToken = await getToken(messaging, {
  vapidKey: "YOUR_VAPID_KEY" // Get from Firebase Console → Project Settings → Cloud Messaging
});

// Register token with backend
await fetch('http://localhost:8000/fcm/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ajiltniiId: userId, // User ID (can be from token or user input)
    token: fcmToken,
    deviceType: 'web', // or 'ios', 'android'
    deviceId: deviceId, // Optional
    appVersion: '1.0.0', // Optional
    baiguullagiinId: companyId // Optional
  })
});
```

**Important:** This works even if the user is **not logged in**! Just provide the `ajiltniiId`.

### 2. Handle Push Notifications

```javascript
import { onMessage } from "firebase/messaging";

// Handle foreground notifications
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
  // Show notification in your app
  showNotification(payload.notification.title, payload.notification.body);
});
```

### 3. Background Notifications

Background notifications are handled automatically by Firebase SDK. Make sure your service worker is set up correctly.

## 🔌 API Endpoints

### Register/Update FCM Token

**POST** `/fcm/register`

**Body:**
```json
{
  "ajiltniiId": "695c57521a8a4aebc1d65b05",
  "token": "fcm-token-here",
  "deviceType": "web",
  "deviceId": "optional-device-id",
  "appVersion": "1.0.0",
  "baiguullagiinId": "optional-company-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token амжилттай бүртгэгдлээ",
  "data": { ... }
}
```

**Note:** No authentication required! Just provide `ajiltniiId`.

### Get User's FCM Tokens

**GET** `/fcm/tokens?ajiltniiId=695c57521a8a4aebc1d65b05`

### Deactivate Token

**PUT** `/fcm/deactivate`

**Body:**
```json
{
  "token": "fcm-token-here"
}
```

### Remove Token

**DELETE** `/fcm/token/:token`

## 🔔 How It Works

1. **User registers FCM token** → Stored in database with `ajiltniiId`
2. **Notification is created** → Backend automatically sends FCM push notification
3. **User receives notification** → Even if app is closed or user is not logged in

### Automatic Push Notifications

Push notifications are automatically sent when:
- ✅ Task is created/updated/completed
- ✅ Project is created/updated
- ✅ Chat message is sent
- ✅ Any notification is created via API

## 📊 Database Schema

FCM tokens are stored in the `fcmToken` collection (main database):

```javascript
{
  ajiltniiId: String,      // User ID
  token: String,           // FCM device token (unique)
  deviceType: String,      // "ios", "android", "web"
  deviceId: String,         // Optional device identifier
  appVersion: String,      // Optional app version
  isActive: Boolean,        // Token is active
  lastUsed: Date,          // Last time token was used
  baiguullagiinId: String  // Optional company ID
}
```

## 🛠️ Troubleshooting

### Firebase Not Initialized

If you see: `[FCM] ⚠️ Firebase not initialized`

- Check that `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_PROJECT_ID` is set in `.env`
- Verify the service account file exists and is valid JSON
- Check server logs for initialization errors

### No Tokens Found

If you see: `[FCM] No FCM tokens found for user: ...`

- User hasn't registered their FCM token yet
- Token was deactivated (invalid/expired)
- Make sure frontend is calling `/fcm/register`

### Push Notifications Not Received

1. **Check token registration:**
   ```bash
   GET /fcm/tokens?ajiltniiId=USER_ID
   ```

2. **Check Firebase Console:**
   - Verify project is set up correctly
   - Check Cloud Messaging API is enabled
   - Verify VAPID key is correct

3. **Check device permissions:**
   - Browser/app must have notification permissions
   - Service worker must be registered (for web)

4. **Check server logs:**
   - Look for `[FCM] ✅ Push notification sent` messages
   - Check for any error messages

## 🔒 Security Notes

- FCM tokens are stored per user (`ajiltniiId`)
- Tokens are automatically deactivated if invalid
- Multiple devices per user are supported
- No authentication required for token registration (by design - works when user is not logged in)

## 📝 Example Flow

1. **User opens app** (not logged in)
   ```javascript
   // Get FCM token
   const token = await getToken(messaging);
   
   // Register with backend (no auth needed)
   await fetch('/fcm/register', {
     method: 'POST',
     body: JSON.stringify({
       ajiltniiId: 'user-id-from-local-storage-or-input',
       token: token
     })
   });
   ```

2. **User receives notification** (even when app is closed)
   - Backend creates notification
   - FCM push notification is sent automatically
   - User sees notification on device

3. **User opens notification**
   - App opens
   - Notification data is available
   - User can view the notification

## 🔗 Related Documentation

- [MEDEGDEL_API.md](./MEDEGDEL_API.md) - Notification API
- [SOCKET_API.md](./SOCKET_API.md) - Socket.IO real-time updates
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
