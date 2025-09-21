// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// netlify-ignore: These are client-side Firebase config values, not secrets
// They are meant to be public and security is handled by Firebase Security Rules
const firebaseConfig = {
    apiKey: "AIzaSyDkY-zqguZ2tqSHX17FQJGe53r5O2Ah7s8",
    authDomain: "hariwrites-9b180.firebaseapp.com",
    projectId: "hariwrites-9b180",
    storageBucket: "hariwrites-9b180.firebasestorage.app",
    messagingSenderId: "736661564721",
    appId: "1:736661564721:web:3e3dc3ac8f173c45a6d410",
    measurementId: "G-G7ZSW8D08Q"
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

// Admin email - change this to your email
const ADMIN_EMAIL = 'chaitanyaratansree@gmail.com';

// Auth state observer
let currentUser = null;
let isAdmin = false;

auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        isAdmin = user.email === ADMIN_EMAIL;
        updateUIForAuth(user);
    } else {
        isAdmin = false;
        updateUIForAuth(null);
    }
});

// Update UI based on authentication
function updateUIForAuth(user) {
    const adminElements = document.querySelectorAll('.admin-only');
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');

    // Show/hide admin elements
    adminElements.forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });

    // Show/hide authenticated user elements
    authElements.forEach(el => {
        el.style.display = user ? 'block' : 'none';
    });

    // Show/hide guest elements
    guestElements.forEach(el => {
        el.style.display = !user ? 'block' : 'none';
    });

    // Update nav menu
    updateNavMenu(user);
}

// Update navigation menu
function updateNavMenu(user) {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    // Remove existing auth links
    const existingAuthLinks = navMenu.querySelectorAll('.auth-link');
    existingAuthLinks.forEach(link => link.remove());

    if (user) {
        // Add user info and logout
        const userInfo = document.createElement('span');
        userInfo.className = 'nav-user-info auth-link';
        userInfo.textContent = user.email;

        const logoutLink = document.createElement('a');
        logoutLink.className = 'nav-link auth-link';
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.onclick = (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        };

        navMenu.insertBefore(userInfo, navMenu.querySelector('#darkModeToggle'));
        navMenu.insertBefore(logoutLink, navMenu.querySelector('#darkModeToggle'));
    } else {
        // Add login link
        const loginLink = document.createElement('a');
        loginLink.className = 'nav-link auth-link';
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login';

        navMenu.insertBefore(loginLink, navMenu.querySelector('#darkModeToggle'));
    }
}

// Check if user is admin
function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user && user.email === ADMIN_EMAIL) {
                resolve(true);
            } else {
                reject('Admin access required');
            }
        });
    });
}

// Firebase Firestore functions for articles
class FirebaseArticleStorage {
    async getAllArticles() {
        try {
            const snapshot = await db.collection('articles')
                .where('status', '==', 'published')
                .get();

            const articles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by date in JavaScript to avoid index requirement
            return articles.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA; // Newest first
            });
        } catch (error) {
            console.error('Error getting articles:', error);
            return [];
        }
    }

    async getArticleById(id) {
        try {
            const doc = await db.collection('articles').doc(id).get();
            if (doc.exists) {
                // Increment views
                await doc.ref.update({
                    views: firebase.firestore.FieldValue.increment(1)
                });
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting article:', error);
            return null;
        }
    }

    async saveArticle(article) {
        try {
            // Only admins can save articles
            if (!isAdmin) {
                throw new Error('Admin access required');
            }

            if (article.id) {
                // Update existing article
                const { id, ...data } = article;
                await db.collection('articles').doc(id).update(data);
                return article;
            } else {
                // Create new article
                article.date = firebase.firestore.Timestamp.now();
                article.views = 0;
                article.likes = 0;
                article.authorEmail = currentUser.email;

                const docRef = await db.collection('articles').add(article);
                return { id: docRef.id, ...article };
            }
        } catch (error) {
            console.error('Error saving article:', error);
            throw error;
        }
    }

    async deleteArticle(id) {
        try {
            if (!isAdmin) {
                throw new Error('Admin access required');
            }
            await db.collection('articles').doc(id).delete();
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    }

    async getComments(articleId) {
        try {
            const snapshot = await db.collection('comments')
                .where('articleId', '==', articleId)
                .orderBy('date', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    }

    async addComment(articleId, text, author) {
        try {
            const comment = {
                articleId,
                text,
                author: author || 'Anonymous',
                date: firebase.firestore.Timestamp.now(),
                userEmail: currentUser ? currentUser.email : null
            };

            const docRef = await db.collection('comments').add(comment);
            return { id: docRef.id, ...comment };
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    async getAllComments() {
        try {
            if (!isAdmin) {
                throw new Error('Admin access required');
            }

            const snapshot = await db.collection('comments')
                .orderBy('date', 'desc')
                .limit(50)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all comments:', error);
            return [];
        }
    }

    async getDrafts() {
        try {
            if (!isAdmin) {
                throw new Error('Admin access required');
            }

            const snapshot = await db.collection('articles')
                .where('status', '==', 'draft')
                .orderBy('date', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting drafts:', error);
            return [];
        }
    }
}

// Create global storage instance
const firebaseStorage = new FirebaseArticleStorage();

// Helper function to format Firestore timestamp
function formatFirestoreDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Helper function to format Firestore timestamp with time
function formatFirestoreDateTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}