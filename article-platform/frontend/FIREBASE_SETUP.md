# Firebase Setup Guide for Article Hub

This guide will help you set up Firebase for your Article Hub website with multi-device access and admin controls.

## 🚀 Quick Start

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it (e.g., "article-hub")
4. Disable Google Analytics (optional)
5. Click **"Create Project"**

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get Started**
2. Click **"Sign-in method"** tab
3. Enable **Email/Password**:
   - Click on Email/Password
   - Toggle "Enable"
   - Save
4. Enable **Google** (optional):
   - Click on Google
   - Toggle "Enable"
   - Add your project support email
   - Save

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **"Start in production mode"**
3. Select your region (closest to your users)
4. Click **"Enable"**

### 4. Set Security Rules

1. In Firestore, go to **Rules** tab
2. Replace default rules with contents from `firestore.rules`
3. Click **"Publish"**

### 5. Get Your Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **"Web"** icon
3. Register app with a nickname (e.g., "article-hub-web")
4. Copy the configuration object

### 6. Update firebase-config.js

Replace the placeholder values in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 7. Set Your Admin Email

In `firebase-config.js`, update the admin email:

```javascript
const ADMIN_EMAIL = 'your-email@example.com';  // Change this!
```

## 📱 How It Works

### User Roles

1. **Admin (your email)**:
   - Can create/edit/delete articles
   - Access admin dashboard
   - Manage all comments
   - Export/import data

2. **Regular Users**:
   - Can read all articles
   - Post comments
   - Create accounts

3. **Anonymous Visitors**:
   - Can read articles
   - Post comments (as "Anonymous")

### Features

- ✅ **Multi-device access**: Login from any device to access the same articles
- ✅ **Real-time sync**: Changes appear instantly across all devices
- ✅ **Offline support**: Works offline, syncs when connected
- ✅ **Secure**: Admin-only write access, public read access
- ✅ **Comments**: Anyone can comment, even without account

## 🚀 Deployment

### Deploy to Netlify

1. **Remove old localStorage code** (already done - using Firebase now)
2. **Deploy to Netlify**:
   ```bash
   cd article-platform/frontend
   # Deploy with Netlify CLI
   npx netlify-cli deploy --prod
   ```

   Or drag the `frontend` folder to [Netlify Drop](https://app.netlify.com/drop)

### First Time Setup

1. **Create Admin Account**:
   - Go to your deployed site
   - Click "Login"
   - Click "Sign up"
   - Use your admin email (set in firebase-config.js)
   - Create a password (min 6 characters)

2. **Create First Article**:
   - Login with admin account
   - Go to "Write" (only visible to admin)
   - Create your first article
   - Publish it

3. **Test Multi-Device**:
   - Open site on phone/tablet
   - Articles appear without login
   - Login as admin to write from any device

## 🔒 Security

### Firestore Rules Explained

```javascript
// Anyone can read published articles
allow read: if resource.data.status == 'published';

// Only admin can write articles
allow write: if request.auth.token.email == 'admin@articlehub.com';

// Anyone can post comments
allow create: if true;
```

### Best Practices

1. **Use strong admin password**
2. **Keep firebase config public** (it's meant to be public)
3. **Security is in Firestore rules**, not hiding config
4. **Enable 2FA** on your Firebase account
5. **Monitor usage** in Firebase Console

## 📊 Firebase Console Management

### Monitor Your App

1. **Authentication**: See all users
2. **Firestore**: View/edit data directly
3. **Usage**: Monitor reads/writes/storage
4. **Analytics**: Track user engagement

### Quotas (Free Tier)

- **Firestore**:
  - 50K reads/day
  - 20K writes/day
  - 1GB storage
- **Authentication**:
  - Unlimited users
  - 10K SMS verifications/month
- **Hosting**: 10GB/month bandwidth

Perfect for small to medium blogs!

## 🐛 Troubleshooting

### Common Issues

1. **"Admin access required"**:
   - Make sure you're logged in with the email set in `ADMIN_EMAIL`
   - Check firebase-config.js

2. **Articles not showing**:
   - Check Firestore has articles with `status: "published"`
   - Check browser console for errors

3. **Can't write articles**:
   - Verify admin email matches exactly
   - Check authentication is enabled

4. **Comments not posting**:
   - Check Firestore rules are published
   - Verify database is created

### Reset Everything

If needed, you can start fresh:
1. Delete all documents in Firestore
2. Delete all users in Authentication
3. Recreate admin account

## 📝 Data Structure

### Articles Collection
```json
{
  "title": "Article Title",
  "author": "Author Name",
  "content": "Article content...",
  "summary": "Brief summary",
  "category": "technology",
  "tags": ["web", "development"],
  "status": "published",
  "date": "Timestamp",
  "views": 0,
  "likes": 0
}
```

### Comments Collection
```json
{
  "articleId": "article_id_here",
  "author": "Commenter Name",
  "text": "Comment text",
  "date": "Timestamp",
  "userEmail": "user@example.com"
}
```

## 🎉 You're Done!

Your Article Hub now has:
- ✅ Multi-device access
- ✅ Admin-only article creation
- ✅ Public reading for everyone
- ✅ Real-time updates
- ✅ Secure authentication
- ✅ Professional blog platform

### Next Steps

1. Customize the admin email
2. Create your first article
3. Share your blog URL
4. Monitor usage in Firebase Console

Enjoy your new blog platform! 🚀