// Admin dashboard with Firebase integration (Admin only)

// Check admin access
checkAdminAccess().catch(() => {
    alert('Admin access required');
    window.location.href = 'login.html';
});

// DOM elements
const totalArticles = document.getElementById('totalArticles');
const totalComments = document.getElementById('totalComments');
const totalViews = document.getElementById('totalViews');
const draftCount = document.getElementById('draftCount');
const pendingCount = document.getElementById('pendingCount');
const articlesTableBody = document.getElementById('articlesTableBody');
const recentComments = document.getElementById('recentComments');
const adminSearch = document.getElementById('adminSearch');
const adminFilter = document.getElementById('adminFilter');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');
const clearBtn = document.getElementById('clearData');
const importFile = document.getElementById('importFile');
const darkModeToggle = document.getElementById('darkModeToggle');

// State
let allArticles = [];
let allComments = [];

// Dark mode
function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.textContent = '☀️';
    }
}

darkModeToggle?.addEventListener('click', () => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'false');
        darkModeToggle.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'true');
        darkModeToggle.textContent = '☀️';
    }
});

// Load dashboard data from Firebase
async function loadDashboard() {
    try {
        // Get all articles (published and drafts)
        const publishedQuery = await db.collection('articles')
            .where('status', '==', 'published')
            .get();

        const draftQuery = await db.collection('articles')
            .where('status', '==', 'draft')
            .get();

        const pendingQuery = await db.collection('articles')
            .where('status', '==', 'pending')
            .get();

        const published = publishedQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const drafts = draftQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pending = pendingQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        allArticles = [...published, ...drafts, ...pending];

        // Get all comments
        const commentsQuery = await db.collection('comments')
            .orderBy('date', 'desc')
            .limit(100)
            .get();

        allComments = commentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate stats
        const totalViewsCount = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);

        // Update stats
        totalArticles.textContent = published.length;
        totalComments.textContent = allComments.length;
        totalViews.textContent = totalViewsCount;
        draftCount.textContent = drafts.length;
        if (pendingCount) pendingCount.textContent = pending.length;

        // Load articles table
        loadArticlesTable();

        // Load recent comments
        loadRecentComments();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load articles table
function loadArticlesTable() {
    let articles = [...allArticles];

    // Apply filters
    const searchTerm = adminSearch?.value.toLowerCase() || '';
    const filterStatus = adminFilter?.value || 'all';

    if (searchTerm) {
        articles = articles.filter(article =>
            article.title?.toLowerCase().includes(searchTerm) ||
            article.author?.toLowerCase().includes(searchTerm) ||
            article.category?.toLowerCase().includes(searchTerm)
        );
    }

    if (filterStatus !== 'all') {
        articles = articles.filter(article => (article.status || 'published') === filterStatus);
    }

    // Sort by date
    articles.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return dateB - dateA;
    });

    if (articles.length === 0) {
        articlesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">No articles found</td>
            </tr>
        `;
        return;
    }

    articlesTableBody.innerHTML = articles.map(article => {
        const date = article.date?.toDate ? article.date.toDate() : new Date(article.date || Date.now());
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const status = article.status || 'published';
        const statusClass = status === 'published' ? 'status-published' :
                           status === 'draft' ? 'status-draft' : 'status-pending';

        return `
            <tr>
                <td>${article.title || 'Untitled'}</td>
                <td>${article.author || 'Anonymous'}</td>
                <td>${article.category || 'uncategorized'}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${article.views || 0}</td>
                <td>
                    <div class="action-btns">
                        ${status === 'published' ?
                            `<button class="action-btn" onclick="viewArticle('${article.id}')" title="View">👁️</button>` :
                            `<button class="action-btn" onclick="editDraft('${article.id}')" title="Edit Draft">✏️</button>`
                        }
                        ${status === 'draft' ?
                            `<button class="action-btn" onclick="publishDraft('${article.id}')" title="Publish">📢</button>` : ''
                        }
                        ${status === 'pending' ?
                            `<button class="action-btn" onclick="approveArticle('${article.id}')" title="Approve" style="color: green;">✅</button>
                             <button class="action-btn" onclick="rejectArticle('${article.id}')" title="Reject" style="color: red;">❌</button>` : ''
                        }
                        <button class="action-btn" onclick="deleteArticle('${article.id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load recent comments
function loadRecentComments() {
    const recentCommentsList = allComments.slice(0, 5);

    if (recentCommentsList.length === 0) {
        recentComments.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No comments yet</p>';
        return;
    }

    recentComments.innerHTML = recentCommentsList.map(comment => {
        const article = allArticles.find(a => a.id === comment.articleId);
        const date = comment.date?.toDate ? comment.date.toDate() : new Date(comment.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="recent-comment">
                <div class="recent-comment-header">
                    <span class="recent-comment-article">${article ? article.title : 'Unknown Article'}</span>
                    <span class="recent-comment-date">${formattedDate}</span>
                </div>
                <p><strong>${comment.author}:</strong> ${comment.text}</p>
            </div>
        `;
    }).join('');
}

// Article actions
window.viewArticle = function(id) {
    window.open(`article.html?id=${id}`, '_blank');
};

window.editDraft = function(id) {
    alert('Edit functionality coming soon. For now, create a new article.');
};

window.publishDraft = async function(id) {
    const draft = allArticles.find(a => a.id === id);
    if (draft && confirm(`Publish "${draft.title}"?`)) {
        try {
            await db.collection('articles').doc(id).update({
                status: 'published',
                date: firebase.firestore.Timestamp.now()
            });
            showNotification('Article published successfully!');
            loadDashboard();
        } catch (error) {
            console.error('Error publishing draft:', error);
            showNotification('Error publishing draft', 'error');
        }
    }
};

window.approveArticle = async function(id) {
    const article = allArticles.find(a => a.id === id);
    if (article && confirm(`Approve "${article.title}"?`)) {
        try {
            await db.collection('articles').doc(id).update({
                status: 'published',
                approvedAt: firebase.firestore.Timestamp.now(),
                approvedBy: currentUser.email
            });
            showNotification('Article approved and published!');
            loadDashboard();
        } catch (error) {
            console.error('Error approving article:', error);
            showNotification('Error approving article', 'error');
        }
    }
};

window.rejectArticle = async function(id) {
    const article = allArticles.find(a => a.id === id);
    const reason = prompt(`Reject "${article.title}"?\nOptional: Enter rejection reason:`);

    if (reason !== null) {
        try {
            await db.collection('articles').doc(id).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.Timestamp.now(),
                rejectedBy: currentUser.email,
                rejectionReason: reason || 'No reason provided'
            });
            showNotification('Article rejected');
            loadDashboard();
        } catch (error) {
            console.error('Error rejecting article:', error);
            showNotification('Error rejecting article', 'error');
        }
    }
};

window.deleteArticle = async function(id) {
    if (confirm('Are you sure you want to delete this article?')) {
        try {
            await db.collection('articles').doc(id).delete();

            // Also delete associated comments
            const commentsQuery = await db.collection('comments')
                .where('articleId', '==', id)
                .get();

            const batch = db.batch();
            commentsQuery.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            showNotification('Article deleted successfully!');
            loadDashboard();
        } catch (error) {
            console.error('Error deleting article:', error);
            showNotification('Error deleting article', 'error');
        }
    }
};

// Export data
exportBtn?.addEventListener('click', async () => {
    try {
        const data = {
            articles: allArticles.map(a => ({
                ...a,
                date: a.date?.toDate ? a.date.toDate().toISOString() : a.date
            })),
            comments: allComments.map(c => ({
                ...c,
                date: c.date?.toDate ? c.date.toDate().toISOString() : c.date
            })),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `articlehub-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
});

// Import data
importBtn?.addEventListener('click', () => {
    importFile.click();
});

importFile?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (!confirm('This will add the imported articles to your existing data. Continue?')) {
                return;
            }

            // Import articles
            if (data.articles && Array.isArray(data.articles)) {
                for (const article of data.articles) {
                    const { id, ...articleData } = article;
                    articleData.date = firebase.firestore.Timestamp.fromDate(new Date(articleData.date));
                    await db.collection('articles').add(articleData);
                }
            }

            // Import comments
            if (data.comments && Array.isArray(data.comments)) {
                for (const comment of data.comments) {
                    const { id, ...commentData } = comment;
                    commentData.date = firebase.firestore.Timestamp.fromDate(new Date(commentData.date));
                    await db.collection('comments').add(commentData);
                }
            }

            showNotification('Data imported successfully!');
            loadDashboard();
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Import failed. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
});

// Clear all data
clearBtn?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        return;
    }

    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
        return;
    }

    try {
        // Delete all articles
        const articlesQuery = await db.collection('articles').get();
        const articlesBatch = db.batch();
        articlesQuery.docs.forEach(doc => {
            articlesBatch.delete(doc.ref);
        });
        await articlesBatch.commit();

        // Delete all comments
        const commentsQuery = await db.collection('comments').get();
        const commentsBatch = db.batch();
        commentsQuery.docs.forEach(doc => {
            commentsBatch.delete(doc.ref);
        });
        await commentsBatch.commit();

        showNotification('All data cleared successfully!');
        loadDashboard();
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error clearing data', 'error');
    }
});

// Search and filter
adminSearch?.addEventListener('input', loadArticlesTable);
adminFilter?.addEventListener('change', loadArticlesTable);

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease;
        z-index: 1000;
    }

    .notification-success {
        background-color: var(--success-color);
        color: white;
    }

    .notification-error {
        background-color: var(--danger-color);
        color: white;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Wait for auth to initialize
    setTimeout(() => {
        loadDashboard();
    }, 1500);
});