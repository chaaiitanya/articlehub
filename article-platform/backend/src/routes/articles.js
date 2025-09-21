const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { validateArticle, validateId } = require('../utils/validators');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const db = await connectDB();
    const result = await db.query(
      'SELECT * FROM articles WHERE published = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM articles WHERE published = true');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateId, async (req, res, next) => {
  try {
    const db = await connectDB();

    await db.query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [req.params.id]
    );

    const result = await db.query(
      'SELECT * FROM articles WHERE id = $1 AND published = true',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const db = await connectDB();

    await db.query(
      'UPDATE articles SET view_count = view_count + 1 WHERE slug = $1',
      [req.params.slug]
    );

    const result = await db.query(
      'SELECT * FROM articles WHERE slug = $1 AND published = true',
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;