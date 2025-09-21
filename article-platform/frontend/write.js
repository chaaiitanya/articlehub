// Write article page JavaScript
class ArticleStorage {
    constructor() {
        this.storageKey = 'articleHub_articles';
        this.draftsKey = 'articleHub_drafts';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getAllArticles() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    saveArticle(article) {
        const articles = this.getAllArticles();
        if (!article.id) {
            article.id = this.generateId();
            article.date = new Date().toISOString();
            article.views = 0;
            article.likes = 0;
            articles.unshift(article);
        } else {
            const index = articles.findIndex(a => a.id === article.id);
            if (index !== -1) {
                articles[index] = { ...articles[index], ...article };
            }
        }
        localStorage.setItem(this.storageKey, JSON.stringify(articles));
        return article;
    }

    saveDraft(article) {
        const drafts = JSON.parse(localStorage.getItem(this.draftsKey) || '[]');
        if (!article.id) {
            article.id = this.generateId();
            article.savedAt = new Date().toISOString();
            drafts.unshift(article);
        } else {
            const index = drafts.findIndex(d => d.id === article.id);
            if (index !== -1) {
                drafts[index] = { ...drafts[index], ...article, savedAt: new Date().toISOString() };
            } else {
                article.savedAt = new Date().toISOString();
                drafts.unshift(article);
            }
        }
        localStorage.setItem(this.draftsKey, JSON.stringify(drafts));
        return article;
    }

    getDrafts() {
        return JSON.parse(localStorage.getItem(this.draftsKey) || '[]');
    }
}

// Initialize storage
const storage = new ArticleStorage();

// DOM elements
const articleForm = document.getElementById('articleForm');
const articleTitle = document.getElementById('articleTitle');
const articleAuthor = document.getElementById('articleAuthor');
const articleCategory = document.getElementById('articleCategory');
const articleTags = document.getElementById('articleTags');
const articleImage = document.getElementById('articleImage');
const articleSummary = document.getElementById('articleSummary');
const articleContent = document.getElementById('articleContent');
const saveDraftBtn = document.getElementById('saveDraft');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const darkModeToggle = document.getElementById('darkModeToggle');

// Character counter for summary
const charCount = document.querySelector('.char-count');
articleSummary?.addEventListener('input', () => {
    const count = articleSummary.value.length;
    charCount.textContent = `${count}/150`;
    charCount.style.color = count > 140 ? 'var(--danger-color)' : 'var(--text-secondary)';
});

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

// Toolbar formatting
document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const format = btn.dataset.format;
        const textarea = articleContent;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let replacement = selectedText;
        let cursorOffset = 0;

        switch(format) {
            case 'bold':
                replacement = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'italic':
                replacement = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : 1;
                break;
            case 'underline':
                replacement = `<u>${selectedText || 'underlined text'}</u>`;
                cursorOffset = selectedText ? 0 : 3;
                break;
            case 'h2':
                replacement = `\n## ${selectedText || 'Heading 2'}\n`;
                cursorOffset = selectedText ? 0 : 3;
                break;
            case 'h3':
                replacement = `\n### ${selectedText || 'Heading 3'}\n`;
                cursorOffset = selectedText ? 0 : 4;
                break;
            case 'ul':
                replacement = `\n- ${selectedText || 'List item'}\n`;
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'ol':
                replacement = `\n1. ${selectedText || 'List item'}\n`;
                cursorOffset = selectedText ? 0 : 3;
                break;
            case 'quote':
                replacement = `\n> ${selectedText || 'Quote'}\n`;
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'code':
                replacement = `\`${selectedText || 'code'}\``;
                cursorOffset = selectedText ? 0 : 1;
                break;
            case 'link':
                const url = prompt('Enter URL:');
                if (url) {
                    replacement = `[${selectedText || 'link text'}](${url})`;
                    cursorOffset = selectedText ? 0 : 1;
                }
                break;
        }

        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
        textarea.focus();
        if (cursorOffset > 0) {
            textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + (selectedText ? selectedText.length : replacement.length - cursorOffset * 2));
        }
    });
});

// Save draft
saveDraftBtn?.addEventListener('click', () => {
    const article = {
        title: articleTitle.value || 'Untitled Draft',
        author: articleAuthor.value,
        category: articleCategory.value,
        tags: articleTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: articleImage.value,
        summary: articleSummary.value,
        content: articleContent.value,
        status: 'draft'
    };

    storage.saveDraft(article);
    showNotification('Draft saved successfully!', 'success');
});

// Auto-save draft every 30 seconds
let autoSaveInterval;
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (articleTitle.value || articleContent.value) {
            const article = {
                title: articleTitle.value || 'Untitled Draft',
                author: articleAuthor.value,
                category: articleCategory.value,
                tags: articleTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
                image: articleImage.value,
                summary: articleSummary.value,
                content: articleContent.value,
                status: 'draft'
            };
            storage.saveDraft(article);
            showNotification('Auto-saved', 'info', 2000);
        }
    }, 30000);
}

// Preview article
previewBtn?.addEventListener('click', () => {
    const title = articleTitle.value || 'Untitled Article';
    const author = articleAuthor.value || 'Anonymous';
    const category = articleCategory.value || 'uncategorized';
    const content = articleContent.value || 'No content yet...';
    const summary = articleSummary.value || 'No summary provided';
    const image = articleImage.value;

    const formattedContent = formatContent(content);

    previewContent.innerHTML = `
        <h1>${title}</h1>
        <div class="article-detail-meta">
            <span>👤 ${author}</span>
            <span>📁 ${category}</span>
            <span>📅 ${new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })}</span>
        </div>
        ${image ? `<img src="${image}" alt="${title}" class="article-detail-image">` : ''}
        <p class="article-summary" style="font-size: 1.125rem; margin: 1.5rem 0; color: var(--text-secondary);">${summary}</p>
        <div class="article-content">
            ${formattedContent}
        </div>
    `;

    previewModal.classList.remove('hidden');
});

// Close modal
document.querySelector('.modal-close')?.addEventListener('click', () => {
    previewModal.classList.add('hidden');
});

// Format content for preview
function formatContent(content) {
    // Convert markdown-like syntax to HTML
    let html = content;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Quotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
        if (!p.startsWith('<') && p.trim()) {
            return `<p>${p}</p>`;
        }
        return p;
    }).join('');

    return html;
}

// Submit form
articleForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const article = {
        title: articleTitle.value,
        author: articleAuthor.value,
        category: articleCategory.value,
        tags: articleTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: articleImage.value,
        summary: articleSummary.value,
        content: articleContent.value,
        status: 'published'
    };

    const savedArticle = storage.saveArticle(article);
    showNotification('Article published successfully!', 'success');

    // Clear form
    articleForm.reset();
    charCount.textContent = '0/150';

    // Redirect to article page after a delay
    setTimeout(() => {
        window.location.href = `article.html?id=${savedArticle.id}`;
    }, 2000);
});

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), duration);
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

    .notification-info {
        background-color: var(--primary-color);
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

// Load draft if exists (from URL parameter)
function loadDraft() {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');

    if (draftId) {
        const drafts = storage.getDrafts();
        const draft = drafts.find(d => d.id === draftId);

        if (draft) {
            articleTitle.value = draft.title || '';
            articleAuthor.value = draft.author || '';
            articleCategory.value = draft.category || '';
            articleTags.value = draft.tags ? draft.tags.join(', ') : '';
            articleImage.value = draft.image || '';
            articleSummary.value = draft.summary || '';
            articleContent.value = draft.content || '';

            // Update character count
            const count = articleSummary.value.length;
            charCount.textContent = `${count}/150`;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    loadDraft();
    startAutoSave();
});

// Clean up auto-save on page unload
window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});