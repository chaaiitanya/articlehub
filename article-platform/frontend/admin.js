// Admin dashboard JavaScript
class ArticleStorage {
    constructor() {
        this.storageKey = 'articleHub_articles';
        this.commentsKey = 'articleHub_comments';
        this.draftsKey = 'articleHub_drafts';
    }

    getAllArticles() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    getAllComments() {
        return JSON.parse(localStorage.getItem(this.commentsKey) || '[]');
    }

    getDrafts() {
        return JSON.parse(localStorage.getItem(this.draftsKey) || '[]');
    }

    deleteArticle(id) {
        const articles = this.getAllArticles();
        const filtered = articles.filter(article => article.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    saveArticle(article) {
        const articles = this.getAllArticles();
        const index = articles.findIndex(a => a.id === article.id);
        if (index !== -1) {
            articles[index] = { ...articles[index], ...article };
            localStorage.setItem(this.storageKey, JSON.stringify(articles));
        }
        return article;
    }

    exportData() {
        const data = {
            articles: this.getAllArticles(),
            comments: this.getAllComments(),
            drafts: this.getDrafts(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.articles) {
                localStorage.setItem(this.storageKey, JSON.stringify(data.articles));
            }
            if (data.comments) {
                localStorage.setItem(this.commentsKey, JSON.stringify(data.comments));
            }
            if (data.drafts) {
                localStorage.setItem(this.draftsKey, JSON.stringify(data.drafts));
            }

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.commentsKey);
        localStorage.removeItem(this.draftsKey);
        // Re-initialize with empty arrays
        localStorage.setItem(this.storageKey, '[]');
        localStorage.setItem(this.commentsKey, '[]');
        localStorage.setItem(this.draftsKey, '[]');
    }
}

// Initialize storage
const storage = new ArticleStorage();

// DOM elements
const totalArticles = document.getElementById('totalArticles');
const totalComments = document.getElementById('totalComments');
const totalViews = document.getElementById('totalViews');
const draftCount = document.getElementById('draftCount');
const articlesTableBody = document.getElementById('articlesTableBody');
const recentComments = document.getElementById('recentComments');
const adminSearch = document.getElementById('adminSearch');
const adminFilter = document.getElementById('adminFilter');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');
const clearBtn = document.getElementById('clearData');
const importFile = document.getElementById('importFile');
const darkModeToggle = document.getElementById('darkModeToggle');

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

// Load dashboard data
function loadDashboard() {
    const articles = storage.getAllArticles();
    const comments = storage.getAllComments();
    const drafts = storage.getDrafts();

    // Update stats
    totalArticles.textContent = articles.length;
    totalComments.textContent = comments.length;
    totalViews.textContent = articles.reduce((sum, article) => sum + (article.views || 0), 0);
    draftCount.textContent = drafts.length;

    // Load articles table
    loadArticlesTable();

    // Load recent comments
    loadRecentComments();
}

// Load articles table
function loadArticlesTable() {
    let articles = [...storage.getAllArticles(), ...storage.getDrafts()];

    // Apply filters
    const searchTerm = adminSearch?.value.toLowerCase() || '';
    const filterStatus = adminFilter?.value || 'all';

    if (searchTerm) {
        articles = articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );
    }

    if (filterStatus !== 'all') {
        articles = articles.filter(article => article.status === filterStatus);
    }

    // Sort by date
    articles.sort((a, b) => new Date(b.date || b.savedAt) - new Date(a.date || a.savedAt));

    if (articles.length === 0) {
        articlesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">No articles found</td>
            </tr>
        `;
        return;
    }

    articlesTableBody.innerHTML = articles.map(article => {
        const date = new Date(article.date || article.savedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const status = article.status || 'published';
        const statusClass = status === 'published' ? 'status-published' : 'status-draft';

        return `
            <tr>
                <td>${article.title}</td>
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
                        <button class="action-btn" onclick="deleteArticle('${article.id}', '${status}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load recent comments
function loadRecentComments() {
    const comments = storage.getAllComments();
    const articles = storage.getAllArticles();

    // Sort by date and take last 5
    const recentCommentsList = comments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (recentCommentsList.length === 0) {
        recentComments.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No comments yet</p>';
        return;
    }

    recentComments.innerHTML = recentCommentsList.map(comment => {
        const article = articles.find(a => a.id === comment.articleId);
        const date = new Date(comment.date);
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
    window.location.href = `write.html?draft=${id}`;
};

window.publishDraft = function(id) {
    const drafts = storage.getDrafts();
    const draft = drafts.find(d => d.id === id);

    if (draft && confirm(`Publish "${draft.title}"?`)) {
        draft.status = 'published';
        draft.date = new Date().toISOString();
        storage.saveArticle(draft);

        // Remove from drafts
        const updatedDrafts = drafts.filter(d => d.id !== id);
        localStorage.setItem(storage.draftsKey, JSON.stringify(updatedDrafts));

        showNotification('Article published successfully!');
        loadDashboard();
    }
};

window.deleteArticle = function(id, status) {
    const title = status === 'draft' ? 'draft' : 'article';
    if (confirm(`Are you sure you want to delete this ${title}?`)) {
        if (status === 'draft') {
            const drafts = storage.getDrafts();
            const filtered = drafts.filter(d => d.id !== id);
            localStorage.setItem(storage.draftsKey, JSON.stringify(filtered));
        } else {
            storage.deleteArticle(id);
        }
        showNotification(`${title.charAt(0).toUpperCase() + title.slice(1)} deleted successfully!`);
        loadDashboard();
    }
};

// Export data
exportBtn?.addEventListener('click', () => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `articlehub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!');
});

// Import data
importBtn?.addEventListener('click', () => {
    importFile.click();
});

importFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (storage.importData(event.target.result)) {
            showNotification('Data imported successfully!');
            loadDashboard();
        } else {
            showNotification('Import failed. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
});

// Clear all data
clearBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        if (confirm('This will delete all articles, comments, and drafts. Type "DELETE" to confirm.')) {
            const confirmation = prompt('Type "DELETE" to confirm:');
            if (confirmation === 'DELETE') {
                storage.clearAllData();
                showNotification('All data cleared successfully!');
                loadDashboard();
            }
        }
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
    loadDashboard();
});