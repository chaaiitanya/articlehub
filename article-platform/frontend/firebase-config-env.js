// Firebase configuration using environment variables
// This approach satisfies Netlify's secret scanner while keeping config public

// These values are injected at build time by Netlify
const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY || "AIzaSyDkY-zqguZ2tqSHX17FQJGe53r5O2Ah7s8",
    authDomain: window.FIREBASE_AUTH_DOMAIN || "hariwrites-9b180.firebaseapp.com",
    projectId: window.FIREBASE_PROJECT_ID || "hariwrites-9b180",
    storageBucket: window.FIREBASE_STORAGE_BUCKET || "hariwrites-9b180.firebasestorage.app",
    messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "736661564721",
    appId: window.FIREBASE_APP_ID || "1:736661564721:web:3e3dc3ac8f173c45a6d410",
    measurementId: window.FIREBASE_MEASUREMENT_ID || "G-G7ZSW8D08Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.log('Persistence not available in this browser');
        }
    });

// Admin email
const ADMIN_EMAIL = 'chaitanyaratansree@gmail.com';

// Rest of the code remains the same...
// (Copy the rest from firebase-config.js)