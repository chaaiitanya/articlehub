// Modern Article Page JavaScript

// DOM elements
const articleContent = document.getElementById('articleContent');
const commentText = document.getElementById('commentText');
const commentAuthor = document.getElementById('commentAuthor');
const submitComment = document.getElementById('submitComment');
const commentsList = document.getElementById('commentsList');
const relatedArticles = document.getElementById('relatedArticles');
const darkModeToggle = document.getElementById('darkModeToggle');

// State
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

// Get article ID from URL
function getArticleId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load article
async function loadArticle() {
    const articleId = getArticleId();
    if (!articleId) {
        articleContent.innerHTML = '<p class="error-message">Article not found.</p>';
        return;
    }

    try {
        const article = await firebaseStorage.getArticle(articleId);
        if (!article) {
            articleContent.innerHTML = '<p class="error-message">Article not found.</p>';
            return;
        }

        currentArticle = article;
        displayArticle(article);

        // View count is already incremented in getArticle method

        // Load comments
        loadComments(articleId);

        // Load related articles
        loadRelatedArticles(article.category);
    } catch (error) {
        console.error('Error loading article:', error);
        articleContent.innerHTML = '<p class="error-message">Failed to load article.</p>';
    }
}

// Display article
function displayArticle(article) {
    const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Format content with proper paragraphs
    const formattedContent = (article.content || '')
        .split('\n\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => {
            // Check if it's a heading
            if (para.startsWith('#')) {
                const level = para.match(/^#+/)[0].length;
                const text = para.replace(/^#+\s*/, '');
                return `<h${Math.min(level + 1, 6)}>${text}</h${Math.min(level + 1, 6)}>`;
            }
            // Check if it's a blockquote
            if (para.startsWith('>')) {
                const text = para.replace(/^>\s*/, '');
                return `<blockquote>${text}</blockquote>`;
            }
            // Regular paragraph
            return `<p>${para}</p>`;
        })
        .join('');

    articleContent.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-detail-image" onerror="this.onerror=null; this.style.display='none';">` : ''}
        <div style="padding: 2rem;">
            <span class="featured-category">${article.category || 'General'}</span>
            <h1>${article.title}</h1>
            <div class="article-detail-meta">
                <span>By ${article.author}</span>
                <span>${formattedDate}</span>
                <span>${article.views || 0} views</span>
                ${article.readTime ? `<span>${article.readTime} min read</span>` : ''}
            </div>
            <div class="article-content">
                ${formattedContent}
            </div>
            ${article.tags && article.tags.length > 0 ? `
                <div class="article-tags" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-light);">
                    ${article.tags.map(tag => `
                        <span style="
                            display: inline-block;
                            padding: 0.375rem 0.875rem;
                            background-color: var(--bg-secondary);
                            border: 1px solid var(--border-color);
                            border-radius: 20px;
                            font-size: 0.875rem;
                            color: var(--text-secondary);
                            margin-right: 0.5rem;
                            margin-bottom: 0.5rem;
                        ">#${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Load comments
async function loadComments(articleId) {
    try {
        const comments = await firebaseStorage.getComments(articleId);
        displayComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Display comments
function displayComments(comments) {
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p class="text-center" style="color: var(--text-muted);">No comments yet. Be the first to share your thoughts!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
        const date = comment.date?.toDate ? comment.date.toDate() : new Date(comment.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
            hour: 'numeric',
            minute: 'numeric'
        });

        return `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author-name">${comment.author}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
    }).join('');
}

// Submit comment
submitComment?.addEventListener('click', async () => {
    const text = commentText.value.trim();
    const author = commentAuthor.value.trim() || 'Anonymous';
    const articleId = getArticleId();

    if (!text) {
        alert('Please enter a comment.');
        return;
    }

    try {
        await firebaseStorage.addComment(articleId, {
            text,
            author,
            date: firebase.firestore.Timestamp.now()
        });

        // Clear form
        commentText.value = '';
        commentAuthor.value = '';

        // Reload comments
        loadComments(articleId);
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    }
});

// Load related articles
async function loadRelatedArticles(category) {
    if (!relatedArticles) return;

    try {
        const articles = await firebaseStorage.getAllArticles();
        const related = articles
            .filter(a => a.id !== getArticleId() && a.category === category)
            .slice(0, 3);

        if (related.length === 0) {
            // If no articles in same category, show random articles
            const randomArticles = articles
                .filter(a => a.id !== getArticleId())
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            displayRelatedArticles(randomArticles);
        } else {
            displayRelatedArticles(related);
        }
    } catch (error) {
        console.error('Error loading related articles:', error);
    }
}

// Display related articles
function displayRelatedArticles(articles) {
    if (!articles || articles.length === 0) {
        relatedArticles.style.display = 'none';
        return;
    }

    relatedArticles.innerHTML = articles.map(article => {
        const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="article-card" onclick="window.location.href='article-modern.html?id=${article.id}'">
                ${article.image ?
                    `<img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.onerror=null; this.style.display='none';">` :
                    '<div class="article-image" style="background: linear-gradient(135deg, #e5e7eb, #9ca3af);"></div>'}
                <div class="article-body">
                    <span class="article-category">${article.category || 'General'}</span>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-summary">${article.summary}</p>
                    <div class="article-meta">
                        <div class="article-author">
                            <span>${article.author}</span>
                            <span>• ${formattedDate}</span>
                        </div>
                        <div class="article-stats">
                            <span>👁 ${article.views || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Wait for Firebase auth to initialize
    setTimeout(() => {
        loadArticle();

        // Check if user is admin
        firebase.auth().onAuthStateChanged(user => {
            const adminElements = document.querySelectorAll('.admin-only');
            if (user && user.email === ADMIN_EMAIL) {
                adminElements.forEach(el => el.style.display = '');
            } else {
                adminElements.forEach(el => el.style.display = 'none');
            }
        });
    }, 1000);
});