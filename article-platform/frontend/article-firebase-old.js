// Article detail page with Firebase integration

// Get article ID from URL
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// DOM elements
const articleContent = document.getElementById('articleContent');
const commentText = document.getElementById('commentText');
const commentAuthor = document.getElementById('commentAuthor');
const submitComment = document.getElementById('submitComment');
const commentsList = document.getElementById('commentsList');
const relatedArticles = document.getElementById('relatedArticles');
const darkModeToggle = document.getElementById('darkModeToggle');

// Current article
let currentArticle = null;

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

// Load article from Firebase
async function loadArticle() {
    if (!articleId) {
        articleContent.innerHTML = '<p>Article not found. <a href="index.html">Go back to home</a></p>';
        return;
    }

    try {
        const article = await firebaseStorage.getArticleById(articleId);
        if (!article) {
            articleContent.innerHTML = '<p>Article not found. <a href="index.html">Go back to home</a></p>';
            return;
        }

        currentArticle = article;

        // Update page title
        document.title = `${article.title} - Article Hub`;

        // Format date
        const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Render article
        articleContent.innerHTML = `
            <h1>${article.title}</h1>
            <div class="article-detail-meta">
                <span>👤 ${article.author}</span>
                <span>📅 ${formattedDate}</span>
                <span>📁 ${article.category || 'uncategorized'}</span>
                <span>👁️ ${article.views || 0} views</span>
                <span>❤️ ${article.likes || 0} likes</span>
            </div>
            ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-detail-image" onerror="this.onerror=null; this.style.display='none';">` : ''}
            <div class="article-content">
                ${formatContent(article.content)}
            </div>
            ${article.tags && article.tags.length > 0 ?
                `<div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>` : ''}
        `;

        // Load comments
        await loadComments();

        // Load related articles
        await loadRelatedArticles();
    } catch (error) {
        console.error('Error loading article:', error);
        articleContent.innerHTML = '<p>Error loading article. Please try again later.</p>';
    }
}

// Format article content
function formatContent(content) {
    if (!content) return '';

    // Convert line breaks to paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map(p => {
        // Check for headers
        if (p.startsWith('## ')) {
            return `<h2>${p.substring(3)}</h2>`;
        } else if (p.startsWith('### ')) {
            return `<h3>${p.substring(4)}</h3>`;
        } else if (p.trim()) {
            // Convert markdown-like formatting
            let formatted = p;

            // Bold
            formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Italic
            formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

            // Links
            formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Code
            formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');

            return `<p>${formatted}</p>`;
        }
        return '';
    }).join('');
}

// Load comments from Firebase
async function loadComments() {
    try {
        const comments = await firebaseStorage.getComments(articleId);

        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const date = comment.date?.toDate ? comment.date.toDate() : new Date(comment.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author-name">${comment.author}</span>
                        <span class="comment-date">${formattedDate}</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<p class="error-text">Error loading comments.</p>';
    }
}

// Submit comment
submitComment?.addEventListener('click', async () => {
    const text = commentText.value.trim();
    const author = commentAuthor.value.trim();

    if (!text) {
        alert('Please enter a comment');
        return;
    }

    submitComment.disabled = true;
    submitComment.textContent = 'Posting...';

    try {
        await firebaseStorage.addComment(articleId, text, author);

        // Clear form
        commentText.value = '';
        commentAuthor.value = '';

        // Reload comments
        await loadComments();

        // Show success message
        showNotification('Comment posted successfully!', 'success');
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification('Error posting comment. Please try again.', 'error');
    } finally {
        submitComment.disabled = false;
        submitComment.textContent = 'Post Comment';
    }
});

// Load related articles from Firebase
async function loadRelatedArticles() {
    try {
        const allArticles = await firebaseStorage.getAllArticles();

        // Filter out current article
        const otherArticles = allArticles.filter(a => a.id !== articleId);

        // Find related articles (same category or matching tags)
        let related = otherArticles.filter(article =>
            article.category === currentArticle.category ||
            (article.tags && currentArticle.tags &&
                article.tags.some(tag => currentArticle.tags.includes(tag)))
        );

        // If not enough related, add random articles
        if (related.length < 3) {
            const remaining = otherArticles.filter(a => !related.includes(a));
            related = [...related, ...remaining.slice(0, 3 - related.length)];
        }

        // Limit to 3 articles
        related = related.slice(0, 3);

        if (related.length === 0) {
            relatedArticles.innerHTML = '<p>No related articles found.</p>';
            return;
        }

        relatedArticles.innerHTML = related.map(article => {
            const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="article-card" onclick="window.location.href='article.html?id=${article.id}'">
                    ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.onerror=null; this.style.display='none';">` :
                    '<div class="article-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}
                    <div class="article-body">
                        <span class="article-category">${article.category || 'uncategorized'}</span>
                        <h3 class="article-title">${article.title}</h3>
                        <div class="article-meta">
                            <span>${article.author} • ${formattedDate}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading related articles:', error);
        relatedArticles.innerHTML = '<p>Error loading related articles.</p>';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .article-tags {
        margin-top: 2rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--bg-tertiary);
        color: var(--primary-color);
        border-radius: 20px;
        font-size: 0.875rem;
    }

    .no-comments {
        text-align: center;
        color: var(--text-secondary);
        padding: 2rem;
        background-color: var(--bg-secondary);
        border-radius: var(--radius);
    }

    .error-text {
        text-align: center;
        color: var(--danger-color);
        padding: 1rem;
    }

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

    // Wait for Firebase to initialize
    setTimeout(() => {
        loadArticle();
    }, 1000);
});