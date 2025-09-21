// Api service for interacting with the backend
class ApiService {
    constructor() {
        this.baseUrl = '/api'; // This should be configured via environment variables
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

// DOM elements
const articlesGrid = document.getElementById('articlesGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

// State
let currentPage = 1;
const articlesPerPage = 6;
let allArticles = []; // To store all articles from the backend
let filteredArticles = [];

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

// Load articles
async function loadArticles() {
    try {
        allArticles = await api.getAllArticles();
        filterAndSortArticles();
    } catch (error) {
        console.error('Error loading articles:', error);
        if(articlesGrid) articlesGrid.innerHTML = '<p class="error-message">Failed to load articles.</p>';
    }
}

function filterAndSortArticles() {
    let articles = [...allArticles];

    // Apply filters
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || 'all';

    if (searchTerm) {
        articles = articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.summary.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    if (category !== 'all') {
        articles = articles.filter(article => article.category === category);
    }

    // Apply sorting
    const sortBy = sortFilter?.value || 'newest';
    switch (sortBy) {
        case 'newest':
            articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            articles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'popular':
            articles.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }

    filteredArticles = articles;
    currentPage = 1;
    displayArticles();
}


function displayArticles() {
    if (!articlesGrid) return;

    const start = 0;
    const end = currentPage * articlesPerPage;
    const articlesToShow = filteredArticles.slice(start, end);

    if (currentPage === 1) {
        articlesGrid.innerHTML = '';
    }

    if (articlesToShow.length === 0 && currentPage === 1) {
        articlesGrid.innerHTML = '<p class="no-articles">No articles found. Try adjusting your filters or search terms.</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    articlesToShow.forEach(article => {
        // Avoid re-rendering existing articles on "load more"
        if (!document.getElementById(`article-${article.id}`)) {
            articlesGrid.appendChild(createArticleCard(article));
        }
    });

    // Show/hide load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = end >= filteredArticles.length ? 'none' : 'block';
    }
}

function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.id = `article-${article.id}`;
    card.onclick = () => {
        window.location.href = `article.html?id=${article.id}`;
    };

    const date = new Date(article.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    card.innerHTML = `
        ${article.image_url ? `<img src="${article.image_url}" alt="${article.title}" class="article-image">` :
        '<div class="article-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'}
        <div class="article-body">
            <span class="article-category">${article.category}</span>
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

// Event listeners
searchBtn?.addEventListener('click', () => {
    filterAndSortArticles();
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        filterAndSortArticles();
    }
});

categoryFilter?.addEventListener('change', () => {
    filterAndSortArticles();
});

sortFilter?.addEventListener('change', () => {
    filterAndSortArticles();
});

loadMoreBtn?.addEventListener('click', () => {
    currentPage++;
    displayArticles();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    loadArticles();
});
