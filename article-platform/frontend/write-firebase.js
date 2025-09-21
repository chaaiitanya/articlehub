// Write article page with Firebase integration (Admin only)

// Check admin access
checkAdminAccess().catch(() => {
    alert('Admin access required to write articles');
    window.location.href = 'login.html';
});

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
saveDraftBtn?.addEventListener('click', async () => {
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

    saveDraftBtn.disabled = true;
    saveDraftBtn.textContent = 'Saving...';

    try {
        await firebaseStorage.saveArticle(article);
        showNotification('Draft saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Error saving draft. Please try again.', 'error');
    } finally {
        saveDraftBtn.disabled = false;
        saveDraftBtn.textContent = 'Save Draft';
    }
});

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
        ${image ? `<img src="${image}" alt="${title}" class="article-detail-image" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin: 1rem 0;">` : ''}
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

            // Lists
            formatted = formatted.replace(/^\- (.+)$/gm, '<li>$1</li>');
            formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

            // Quotes
            formatted = formatted.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

            return `<p>${formatted}</p>`;
        }
        return '';
    }).join('');
}

// Submit form
articleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!articleTitle.value || !articleAuthor.value || !articleContent.value) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const submitBtn = articleForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    const article = {
        title: articleTitle.value,
        author: articleAuthor.value,
        category: articleCategory.value || 'uncategorized',
        tags: articleTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: articleImage.value,
        summary: articleSummary.value,
        content: articleContent.value,
        status: 'published'
    };

    try {
        const savedArticle = await firebaseStorage.saveArticle(article);
        showNotification('Article published successfully!', 'success');

        // Clear form
        articleForm.reset();
        charCount.textContent = '0/150';

        // Redirect to article page after a delay
        setTimeout(() => {
            window.location.href = `article.html?id=${savedArticle.id}`;
        }, 2000);
    } catch (error) {
        console.error('Error publishing article:', error);
        showNotification('Error publishing article. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Article';
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Set default author name from current user
    auth.onAuthStateChanged(user => {
        if (user && !articleAuthor.value) {
            articleAuthor.value = user.email.split('@')[0];
        }
    });
});