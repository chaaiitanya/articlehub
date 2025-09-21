const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { validateSearch } = require('../utils/validators');

router.get('/', validateSearch, async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    const db = await connectDB();
    const results = { articles: [], comments: [] };

    if (type === 'articles' || type === 'all') {
      const articlesResult = await db.query(
        `SELECT id, title, slug,
         ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) as rank,
         substring(content, 1, 200) as excerpt,
         created_at
         FROM articles
         WHERE published = true
         AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT 20`,
        [q]
      );
      results.articles = articlesResult.rows;
    }

    if (type === 'comments' || type === 'all') {
      const commentsResult = await db.query(
        `SELECT c.id, c.content, c.author_name, c.created_at, c.article_id,
         a.title as article_title,
         ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $1)) as rank
         FROM comments c
         JOIN articles a ON c.article_id = a.id
         WHERE c.is_hidden = false
         AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
         ORDER BY rank DESC
         LIMIT 20`,
        [q]
      );
      results.comments = commentsResult.rows;
    }

    res.json({
      query: q,
      type,
      results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;