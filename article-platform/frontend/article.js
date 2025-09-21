// Api service for interacting with the backend
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:4000/api'; // This should be configured via environment variables
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Something went wrong');
        }
        return response.json();
    }

    async getAllArticles() {
        const response = await fetch(`${this.baseUrl}/articles`);
        return this.handleResponse(response);
    }

    async getArticleById(id) {
        const response = await fetch(`${this.baseUrl}/articles/${id}`);
        return this.handleResponse(response);
    }

    async getComments(articleId) {
        const response = await fetch(`${this.baseUrl}/comments?articleId=${articleId}`);
        return this.handleResponse(response);
    }

    async addComment(articleId, text, author) {
        const response = await fetch(`${this.baseUrl}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article_id: articleId, content: text, author: author || 'Anonymous' }),
        });
        return this.handleResponse(response);
    }
}

// Initialize API service
const api = new ApiService();

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
        if(darkModeToggle) darkModeToggle.textContent = '☀️';
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
async function loadArticle() {
    if (!articleId) {
        articleContent.innerHTML = '<p>Article not found. <a href="index.html">Go back to home</a></p>';
        return;
    }

    try {
        const article = await api.getArticleById(articleId);

        // Update page title
        document.title = `${article.title} - Article Hub`;

        // Format date
        const date = new Date(article.created_at);
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
            ${article.image_url ? `<img src="${article.image_url}" alt="${article.title}" class="article-detail-image">` : ''}
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

    } catch (error) {
        console.error('Error loading article:', error);
        articleContent.innerHTML = '<p class="error-message">Failed to load article. <a href="index.html">Go back to home</a></p>';
    }
}

function formatContent(content) {
    // Convert newlines to paragraphs for display
    return content.split('\n').map(p => `<p>${p}</p>`).join('');
}

// Load comments
async function loadComments() {
    try {
        const comments = await api.getComments(articleId);

        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const date = new Date(comment.created_at);
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
                    <p class="comment-text">${comment.content}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<p class="error-message">Failed to load comments.</p>';
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

    try {
        await api.addComment(articleId, text, author);

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

    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
});

// Load related articles
async function loadRelatedArticles(currentArticle) {
    try {
        const allArticles = await api.getAllArticles();
        const articles = allArticles.filter(a => a.id !== currentArticle.id);

        // Find related articles (same category or matching tags)
        let related = articles.filter(article =>
            article.category === currentArticle.category ||
            (article.tags && currentArticle.tags &&
                article.tags.some(tag => currentArticle.tags.includes(tag)))
        );

        // If not enough related, add random articles
        if (related.length < 3) {
            const remaining = articles.filter(a => !related.includes(a));
            related = [...related, ...remaining.slice(0, 3 - related.length)];
        }

        // Limit to 3 articles
        related = related.slice(0, 3);

        if (related.length === 0) {
            if (relatedArticles) relatedArticles.innerHTML = '<p>No related articles found.</p>';
            return;
        }

        if(relatedArticles) relatedArticles.innerHTML = related.map(article => {
            const date = new Date(article.created_at);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="article-card" onclick="window.location.href='article.html?id=${article.id}'">
                    ${article.image_url ? `<img src="${article.image_url}" alt="${article.title}" class="article-image">` :
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

    } catch (error) {
        console.error('Error loading related articles:', error);
    }
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
