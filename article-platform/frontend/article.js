// Article detail page JavaScript
class ArticleStorage {
    constructor() {
        this.storageKey = 'articleHub_articles';
        this.commentsKey = 'articleHub_comments';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getAllArticles() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    getArticleById(id) {
        const articles = this.getAllArticles();
        return articles.find(article => article.id === id);
    }

    saveArticle(article) {
        const articles = this.getAllArticles();
        const index = articles.findIndex(a => a.id === article.id);
        if (index !== -1) {
            articles[index] = { ...articles[index], ...article };
        }
        localStorage.setItem(this.storageKey, JSON.stringify(articles));
        return article;
    }

    incrementViews(id) {
        const article = this.getArticleById(id);
        if (article) {
            article.views = (article.views || 0) + 1;
            this.saveArticle(article);
        }
    }

    getComments(articleId) {
        const allComments = JSON.parse(localStorage.getItem(this.commentsKey) || '[]');
        return allComments.filter(comment => comment.articleId === articleId);
    }

    addComment(articleId, text, author) {
        const comments = JSON.parse(localStorage.getItem(this.commentsKey) || '[]');
        const comment = {
            id: this.generateId(),
            articleId,
            text,
            author: author || 'Anonymous',
            date: new Date().toISOString()
        };
        comments.unshift(comment);
        localStorage.setItem(this.commentsKey, JSON.stringify(comments));
        return comment;
    }
}

// Initialize storage
const storage = new ArticleStorage();

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

// Load article
function loadArticle() {
    if (!articleId) {
        articleContent.innerHTML = '<p>Article not found. <a href="index.html">Go back to home</a></p>';
        return;
    }

    const article = storage.getArticleById(articleId);
    if (!article) {
        articleContent.innerHTML = '<p>Article not found. <a href="index.html">Go back to home</a></p>';
        return;
    }

    // Increment views
    storage.incrementViews(articleId);

    // Update page title
    document.title = `${article.title} - Article Hub`;

    // Format date
    const date = new Date(article.date);
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
            <span>📁 ${article.category}</span>
            <span>👁️ ${article.views || 0} views</span>
            <span>❤️ ${article.likes || 0} likes</span>
        </div>
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-detail-image">` : ''}
        <div class="article-content">
            ${formatContent(article.content)}
        </div>
        ${article.tags && article.tags.length > 0 ?
            `<div class="article-tags">
                ${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>` : ''}
    `;

    // Load comments
    loadComments();

    // Load related articles
    loadRelatedArticles(article);
}

function formatContent(content) {
    // Convert line breaks to paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map(p => {
        // Check for headers (lines starting with ##)
        if (p.startsWith('## ')) {
            return `<h2>${p.substring(3)}</h2>`;
        } else if (p.startsWith('### ')) {
            return `<h3>${p.substring(4)}</h3>`;
        } else {
            return `<p>${p}</p>`;
        }
    }).join('');
}

// Load comments
function loadComments() {
    const comments = storage.getComments(articleId);

    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
        const date = new Date(comment.date);
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
}

// Submit comment
submitComment?.addEventListener('click', () => {
    const text = commentText.value.trim();
    const author = commentAuthor.value.trim();

    if (!text) {
        alert('Please enter a comment');
        return;
    }

    storage.addComment(articleId, text, author);

    // Clear form
    commentText.value = '';
    commentAuthor.value = '';

    // Reload comments
    loadComments();

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = 'Comment posted successfully!';
    submitComment.parentElement.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
});

// Load related articles
function loadRelatedArticles(currentArticle) {
    const allArticles = storage.getAllArticles()
        .filter(a => a.status === 'published' && a.id !== currentArticle.id);

    // Find related articles (same category or matching tags)
    let related = allArticles.filter(article =>
        article.category === currentArticle.category ||
        (article.tags && currentArticle.tags &&
            article.tags.some(tag => currentArticle.tags.includes(tag)))
    );

    // If not enough related, add random articles
    if (related.length < 3) {
        const remaining = allArticles.filter(a => !related.includes(a));
        related = [...related, ...remaining.slice(0, 3 - related.length)];
    }

    // Limit to 3 articles
    related = related.slice(0, 3);

    if (related.length === 0) {
        relatedArticles.innerHTML = '<p>No related articles found.</p>';
        return;
    }

    relatedArticles.innerHTML = related.map(article => {
        const date = new Date(article.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="article-card" onclick="window.location.href='article.html?id=${article.id}'">
                ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` :
                '<div class="article-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}
                <div class="article-body">
                    <span class="article-category">${article.category}</span>
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span>${article.author} • ${formattedDate}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add styles for tags and success message
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

    .success-message {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        background-color: var(--success-color);
        color: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease;
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
    loadArticle();
});