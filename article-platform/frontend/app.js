// Article storage using localStorage
class ArticleStorage {
    constructor() {
        this.storageKey = 'articleHub_articles';
        this.commentsKey = 'articleHub_comments';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const sampleArticles = [
                {
                    id: this.generateId(),
                    title: "Getting Started with Web Development",
                    author: "John Doe",
                    category: "technology",
                    tags: ["web", "javascript", "html", "css"],
                    summary: "Learn the basics of web development and start building your first website.",
                    content: "Web development is an exciting field that combines creativity with technical skills. In this comprehensive guide, we'll explore the fundamental technologies that power the modern web: HTML, CSS, and JavaScript.\n\nHTML (HyperText Markup Language) provides the structure of web pages. It's the skeleton that defines headings, paragraphs, links, and other content elements.\n\nCSS (Cascading Style Sheets) brings life to HTML by adding colors, layouts, and visual effects. It's what makes websites beautiful and engaging.\n\nJavaScript adds interactivity, allowing users to engage with dynamic content, form validations, and real-time updates.\n\nGetting started is easier than ever with modern tools and frameworks. Begin with the basics, practice regularly, and build projects that interest you. The web development community is welcoming and supportive, with countless resources available for learners at every level.",
                    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format",
                    date: new Date().toISOString(),
                    views: 342,
                    likes: 45,
                    status: "published"
                },
                {
                    id: this.generateId(),
                    title: "The Future of Artificial Intelligence",
                    author: "Sarah Johnson",
                    category: "technology",
                    tags: ["ai", "machine-learning", "future", "tech"],
                    summary: "Exploring how AI is reshaping our world and what to expect in the coming years.",
                    content: "Artificial Intelligence is no longer just a concept from science fiction. It's here, transforming industries and changing how we interact with technology daily.\n\nFrom voice assistants to recommendation systems, AI has become integral to our digital experiences. Machine learning algorithms analyze vast amounts of data to provide personalized experiences and insights.\n\nIn healthcare, AI assists in diagnosing diseases and developing new treatments. In transportation, self-driving cars promise safer roads. In education, adaptive learning systems personalize instruction for each student.\n\nHowever, with great power comes great responsibility. We must address ethical concerns, ensure fairness in AI systems, and protect privacy while harnessing AI's potential.\n\nThe future holds exciting possibilities: more natural human-computer interactions, breakthrough scientific discoveries, and solutions to complex global challenges. As we advance, collaboration between technologists, policymakers, and society will shape AI's role in our world.",
                    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format",
                    date: new Date(Date.now() - 86400000).toISOString(),
                    views: 567,
                    likes: 89,
                    status: "published"
                },
                {
                    id: this.generateId(),
                    title: "Healthy Habits for Remote Workers",
                    author: "Mike Wilson",
                    category: "health",
                    tags: ["health", "remote-work", "wellness", "productivity"],
                    summary: "Essential tips to maintain physical and mental health while working from home.",
                    content: "Remote work offers flexibility but can blur the boundaries between professional and personal life. Maintaining healthy habits is crucial for long-term success and wellbeing.\n\nStart with a dedicated workspace. Even a small, organized area signals your brain that it's time to focus. Invest in ergonomic furniture to prevent physical strain.\n\nEstablish a routine. Wake up at consistent times, dress for work, and maintain regular meal schedules. These rituals create structure and improve productivity.\n\nTake regular breaks. The Pomodoro Technique - 25 minutes of focused work followed by 5-minute breaks - can boost concentration and prevent burnout.\n\nStay active. Schedule exercise sessions, take walking meetings, or use a standing desk. Physical activity improves mood, energy, and cognitive function.\n\nMaintain social connections. Schedule virtual coffee breaks with colleagues, join online communities, and separate work communications from personal time.\n\nPrioritize mental health. Practice mindfulness, set boundaries, and don't hesitate to seek support when needed. Remember, your wellbeing is essential for sustainable remote work success.",
                    image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format",
                    date: new Date(Date.now() - 172800000).toISOString(),
                    views: 234,
                    likes: 56,
                    status: "published"
                }
            ];
            localStorage.setItem(this.storageKey, JSON.stringify(sampleArticles));
        }

        if (!localStorage.getItem(this.commentsKey)) {
            localStorage.setItem(this.commentsKey, JSON.stringify([]));
        }
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

    deleteArticle(id) {
        const articles = this.getAllArticles();
        const filtered = articles.filter(article => article.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
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

    getAllComments() {
        return JSON.parse(localStorage.getItem(this.commentsKey) || '[]');
    }
}

// Initialize storage
const storage = new ArticleStorage();

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
let filteredArticles = [];

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

// Load articles
function loadArticles() {
    let articles = storage.getAllArticles().filter(a => a.status === 'published');

    // Apply filters
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || 'all';

    if (searchTerm) {
        articles = articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.summary.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    if (category !== 'all') {
        articles = articles.filter(article => article.category === category);
    }

    // Apply sorting
    const sortBy = sortFilter?.value || 'newest';
    switch (sortBy) {
        case 'newest':
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            articles.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'popular':
            articles.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }

    filteredArticles = articles;
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
        if (currentPage === 1 || !document.getElementById(`article-${article.id}`)) {
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

    const date = new Date(article.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    card.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` :
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
    currentPage = 1;
    loadArticles();
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentPage = 1;
        loadArticles();
    }
});

categoryFilter?.addEventListener('change', () => {
    currentPage = 1;
    loadArticles();
});

sortFilter?.addEventListener('change', () => {
    currentPage = 1;
    loadArticles();
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