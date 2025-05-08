# OuttaBounds Registration System

This document explains how to set up and configure the multi-step registration system for OuttaBounds.

## Overview

The registration system consists of a 3-step process:

1. **Email Verification**: Users enter their email address. If the email already exists, they receive a password reset email through Firebase.
2. **Personal Information**: Users enter their title, name, phone number, and marketing preferences.
3. **Password Setup**: Users create a secure password that meets security requirements.

## Configuration

### Firebase Configuration

The registration system uses Firebase Authentication for user management and password reset functionality:

1. Ensure your Firebase project has Email/Password authentication enabled
2. Configure the Firebase project in the environment variables:

```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

## Password Requirements

The registration system enforces the following password requirements:
- At least 8 characters long
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (e.g., @, $, !, %, *, ?, &)

## User Data

When users register, the following information is stored in Firestore:
- Email (used as the document ID)
- Display name
- Full name
- Title (Mr, Mrs, Ms, Dr, etc.)
- First name
- Last name
- Phone number
- Marketing preferences
- Creation timestamp

## Development Notes

- The multi-step registration component is in `src/components/auth/MultiStepSignup.js`
- The Auth context in `src/contexts/AuthContext.js` handles email existence checks and password resets
- Email checks are performed against both Firebase Authentication and Firestore user collections 