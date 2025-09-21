// Article Hub - Main page with Firebase integration

// DOM elements
const articlesGrid = document.getElementById('articlesGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const loadingSpinner = document.getElementById('loadingSpinner');

// State
let allArticles = [];
let filteredArticles = [];
let displayedArticles = 0;
const articlesPerLoad = 6;

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

// Load articles from Firebase
async function loadArticles() {
    showLoading(true);

    try {
        // Get articles from Firebase
        const articles = await firebaseStorage.getAllArticles();
        allArticles = articles;

        // Apply filters
        applyFilters();
    } catch (error) {
        console.error('Error loading articles:', error);
        articlesGrid.innerHTML = '<p class="error-message">Error loading articles. Please try again later.</p>';
    } finally {
        showLoading(false);
    }
}

// Apply filters and sorting
function applyFilters() {
    let articles = [...allArticles];

    // Apply search filter
    const searchTerm = searchInput?.value.toLowerCase() || '';
    if (searchTerm) {
        articles = articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.summary.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    // Apply category filter
    const category = categoryFilter?.value || 'all';
    if (category !== 'all') {
        articles = articles.filter(article => article.category === category);
    }

    // Apply sorting
    const sortBy = sortFilter?.value || 'newest';
    switch (sortBy) {
        case 'newest':
            articles.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            articles.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateA - dateB;
            });
            break;
        case 'popular':
            articles.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }

    filteredArticles = articles;
    displayedArticles = 0;
    articlesGrid.innerHTML = '';
    displayMoreArticles();
}

// Display articles
function displayMoreArticles() {
    const start = displayedArticles;
    const end = Math.min(displayedArticles + articlesPerLoad, filteredArticles.length);

    if (start === 0 && filteredArticles.length === 0) {
        articlesGrid.innerHTML = '<p class="no-articles">No articles found. Try adjusting your filters.</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    for (let i = start; i < end; i++) {
        const article = filteredArticles[i];
        articlesGrid.appendChild(createArticleCard(article));
    }

    displayedArticles = end;

    // Show/hide load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = end >= filteredArticles.length ? 'none' : 'block';
    }
}

// Create article card
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.onclick = () => {
        window.location.href = `article.html?id=${article.id}`;
    };

    const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    card.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.onerror=null; this.style.display='none';">` :
        '<div class="article-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}
        <div class="article-body">
            <span class="article-category">${article.category || 'uncategorized'}</span>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-summary">${article.summary}</p>
            <div class="article-meta">
                <div class="article-author">
                    <span>👤 ${article.author}</span>
                    <span>• ${formattedDate}</span>
                </div>
                <div class="article-stats">
                    <span>👁️ ${article.views || 0}</span>
                    <span>❤️ ${article.likes || 0}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Show/hide loading spinner
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
}

// Event listeners
searchBtn?.addEventListener('click', () => {
    applyFilters();
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyFilters();
    }
});

categoryFilter?.addEventListener('change', () => {
    applyFilters();
});

sortFilter?.addEventListener('change', () => {
    applyFilters();
});

loadMoreBtn?.addEventListener('click', () => {
    displayMoreArticles();
});

// Add styles for error messages
const style = document.createElement('style');
style.textContent = `
    .no-articles {
        text-align: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
        padding: 3rem;
        grid-column: 1 / -1;
    }

    .error-message {
        text-align: center;
        color: var(--danger-color);
        font-size: 1.1rem;
        padding: 3rem;
        grid-column: 1 / -1;
    }

    .nav-user-info {
        color: var(--text-secondary);
        font-size: 0.875rem;
        padding: 0 1rem;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Wait for Firebase auth to initialize
    setTimeout(() => {
        loadArticles();
    }, 1000);
});