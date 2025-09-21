// Modern News Site JavaScript

// DOM elements
const articlesGrid = document.getElementById('articlesGrid');
const featuredSection = document.getElementById('featuredSection');
const featuredArticle = document.getElementById('featuredArticle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const loadingSpinner = document.getElementById('loadingSpinner');
const articleCount = document.getElementById('articleCount');
const viewBtns = document.querySelectorAll('.view-btn');

// State
let allArticles = [];
let filteredArticles = [];
let displayedArticles = 0;
const articlesPerLoad = 9;
let currentView = 'grid';

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

// View toggle
viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;

        if (currentView === 'list') {
            articlesGrid.className = 'articles-list';
        } else {
            articlesGrid.className = 'articles-grid';
        }

        displayArticles(true);
    });
});

// Load articles from Firebase
async function loadArticles() {
    showLoading(true);

    try {
        const articles = await firebaseStorage.getAllArticles();
        allArticles = articles;

        // Set featured article (most viewed or latest)
        if (articles.length > 0) {
            const featured = articles.reduce((prev, current) =>
                (prev.views || 0) > (current.views || 0) ? prev : current
            );
            displayFeaturedArticle(featured);

            // Remove featured from main list
            allArticles = articles.filter(a => a.id !== featured.id);
        }

        applyFilters();
    } catch (error) {
        console.error('Error loading articles:', error);
        articlesGrid.innerHTML = '<p class="error-message">Failed to load articles. Please try again later.</p>';
    } finally {
        showLoading(false);
    }
}

// Display featured article
function displayFeaturedArticle(article) {
    if (!article || !featuredArticle) return;

    const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    featuredArticle.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="featured-image" onerror="this.onerror=null; this.style.display='none';">` : ''}
        <div class="featured-content">
            <span class="featured-category">${article.category || 'General'}</span>
            <h2 class="featured-title">${article.title}</h2>
            <p class="featured-summary">${article.summary}</p>
            <div class="featured-meta">
                <span>By ${article.author}</span>
                <span>${formattedDate}</span>
                <span>${article.views || 0} views</span>
            </div>
        </div>
    `;

    featuredArticle.style.cursor = 'pointer';
    featuredArticle.onclick = () => {
        window.location.href = `article.html?id=${article.id}`;
    };
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
    displayArticles(true);
}

// Display articles
function displayArticles(reset = false) {
    if (!articlesGrid) return;

    if (reset) {
        articlesGrid.innerHTML = '';
        displayedArticles = 0;
    }

    const start = displayedArticles;
    const end = Math.min(displayedArticles + articlesPerLoad, filteredArticles.length);
    const articlesToShow = filteredArticles.slice(start, end);

    if (articlesToShow.length === 0 && displayedArticles === 0) {
        articlesGrid.innerHTML = '<p class="no-articles text-center">No articles found. Try adjusting your filters.</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        updateArticleCount(0);
        return;
    }

    articlesToShow.forEach(article => {
        const articleElement = currentView === 'list' ?
            createArticleListItem(article) :
            createArticleCard(article);
        articlesGrid.appendChild(articleElement);
    });

    displayedArticles = end;
    updateArticleCount(filteredArticles.length);

    // Show/hide load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = end >= filteredArticles.length ? 'none' : 'block';
    }
}

// Create article card (grid view)
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.onclick = () => {
        window.location.href = `article.html?id=${article.id}`;
    };

    const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
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
    `;

    return card;
}

// Create article list item (list view)
function createArticleListItem(article) {
    const item = document.createElement('div');
    item.className = 'article-list-item';
    item.onclick = () => {
        window.location.href = `article.html?id=${article.id}`;
    };

    const date = article.date?.toDate ? article.date.toDate() : new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    item.innerHTML = `
        ${article.image ?
            `<img src="${article.image}" alt="${article.title}" class="article-list-image" onerror="this.onerror=null; this.style.display='none';">` :
            '<div class="article-list-image" style="background: linear-gradient(135deg, #e5e7eb, #9ca3af);"></div>'}
        <div class="article-list-content">
            <span class="article-category">${article.category || 'General'}</span>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-summary">${article.summary}</p>
            <div class="article-meta">
                <span>${article.author} • ${formattedDate}</span>
                <span>👁 ${article.views || 0} views</span>
            </div>
        </div>
    `;

    return item;
}

// Update article count
function updateArticleCount(count) {
    if (articleCount) {
        articleCount.textContent = `${count} article${count !== 1 ? 's' : ''} found`;
    }
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
    displayArticles();
});

// Handle category links in nav
document.querySelectorAll('.nav-link').forEach(link => {
    const categories = ['technology', 'science', 'business', 'health'];
    const linkText = link.textContent.toLowerCase();

    if (categories.includes(linkText)) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            categoryFilter.value = linkText;
            applyFilters();

            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();

    // Wait for Firebase auth to initialize
    setTimeout(() => {
        loadArticles();
    }, 1000);
});