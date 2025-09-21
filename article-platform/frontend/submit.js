// Public article submission (no login required)

// DOM elements
const articleForm = document.getElementById('articleForm');
const articleTitle = document.getElementById('articleTitle');
const articleAuthor = document.getElementById('articleAuthor');
const authorEmail = document.getElementById('authorEmail');
const articleCategory = document.getElementById('articleCategory');
const articleTags = document.getElementById('articleTags');
const articleImage = document.getElementById('articleImage');
const articleSummary = document.getElementById('articleSummary');
const articleContent = document.getElementById('articleContent');
const previewBtn = document.getElementById('previewBtn');
const submitBtn = document.getElementById('submitBtn');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const successMessage = document.getElementById('successMessage');
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

        switch(format) {
            case 'bold':
                replacement = `**${selectedText || 'bold text'}**`;
                break;
            case 'italic':
                replacement = `*${selectedText || 'italic text'}*`;
                break;
            case 'h2':
                replacement = `\n## ${selectedText || 'Heading 2'}\n`;
                break;
            case 'h3':
                replacement = `\n### ${selectedText || 'Heading 3'}\n`;
                break;
            case 'ul':
                replacement = `\n- ${selectedText || 'List item'}\n`;
                break;
            case 'quote':
                replacement = `\n> ${selectedText || 'Quote'}\n`;
                break;
        }

        textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
        textarea.focus();
    });
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
        ${image ? `<img src="${image}" alt="${title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin: 1rem 0;">` : ''}
        <p style="font-size: 1.125rem; margin: 1.5rem 0; color: var(--text-secondary);">${summary}</p>
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

    const paragraphs = content.split('\n\n');
    return paragraphs.map(p => {
        if (p.startsWith('## ')) {
            return `<h2>${p.substring(3)}</h2>`;
        } else if (p.startsWith('### ')) {
            return `<h3>${p.substring(4)}</h3>`;
        } else if (p.trim()) {
            let formatted = p;
            formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
            formatted = formatted.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
            formatted = formatted.replace(/^\- (.+)$/gm, '<li>$1</li>');

            if (formatted.includes('<li>')) {
                formatted = `<ul>${formatted}</ul>`;
            }

            return `<p>${formatted}</p>`;
        }
        return '';
    }).join('');
}

// Submit form (no authentication required)
articleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate minimum word count
    const wordCount = articleContent.value.trim().split(/\s+/).length;
    if (wordCount < 300) {
        showNotification(`Article must be at least 300 words (current: ${wordCount})`, 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const article = {
        title: articleTitle.value,
        author: articleAuthor.value,
        authorEmail: authorEmail.value || null,
        category: articleCategory.value || 'uncategorized',
        tags: articleTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: articleImage.value || null,
        summary: articleSummary.value,
        content: articleContent.value,
        status: 'pending', // All public submissions start as pending
        submittedAt: firebase.firestore.Timestamp.now(),
        date: firebase.firestore.Timestamp.now(),
        views: 0,
        likes: 0,
        isPublicSubmission: true
    };

    try {
        // Add to Firestore
        await db.collection('articles').add(article);

        // Show success message
        successMessage.style.display = 'block';
        articleForm.style.display = 'none';

        // Clear form
        articleForm.reset();
        charCount.textContent = '0/150';

        // Scroll to top
        window.scrollTo(0, 0);

        showNotification('Article submitted successfully!', 'success');
    } catch (error) {
        console.error('Error submitting article:', error);
        showNotification('Error submitting article. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit for Review';
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

// Add styles
const style = document.createElement('style');
style.textContent = `
    .success-banner {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 2rem;
        border-radius: var(--radius-lg);
        text-align: center;
        margin-bottom: 2rem;
    }

    .success-banner h3 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .form-info {
        background-color: var(--bg-tertiary);
        padding: 1rem;
        border-radius: var(--radius);
        margin-bottom: 1.5rem;
    }

    .form-info p {
        margin: 0;
        font-weight: 600;
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
});