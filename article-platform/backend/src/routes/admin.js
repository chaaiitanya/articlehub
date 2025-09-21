const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateAdmin, verifyPassword, hashPassword, generateToken } = require('../middleware/auth');
const { validateArticle, validateId } = require('../utils/validators');
const slugify = require('slugify');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const db = await connectDB();
    const result = await db.query('SELECT * FROM admin_users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    next(error);
  }
});

router.use(authenticateAdmin);

router.get('/articles', async (req, res, next) => {
  try {
    const db = await connectDB();
    const result = await db.query('SELECT * FROM articles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/articles', validateArticle, async (req, res, next) => {
  try {
    const { title, content, published = true } = req.body;
    const slug = slugify(title, { lower: true, strict: true });

    const db = await connectDB();
    const result = await db.query(
      'INSERT INTO articles (title, slug, content, published) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, slug, content, published]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/articles/:id', validateId, validateArticle, async (req, res, next) => {
  try {
    const { title, content, published } = req.body;
    const slug = slugify(title, { lower: true, strict: true });

    const db = await connectDB();
    const result = await db.query(
      'UPDATE articles SET title = $1, slug = $2, content = $3, published = $4 WHERE id = $5 RETURNING *',
      [title, slug, content, published, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/articles/:id', validateId, async (req, res, next) => {
  try {
    const db = await connectDB();
    const result = await db.query('DELETE FROM articles WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/comments', async (req, res, next) => {
  try {
    const { flagged } = req.query;
    const db = await connectDB();

    let query = 'SELECT c.*, a.title as article_title FROM comments c JOIN articles a ON c.article_id = a.id';
    if (flagged === 'true') {
      query += ' WHERE c.is_flagged = true';
    }
    query += ' ORDER BY c.created_at DESC';

    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.put('/comments/:id/visibility', validateId, async (req, res, next) => {
  try {
    const { is_hidden } = req.body;
    const db = await connectDB();

    const result = await db.query(
      'UPDATE comments SET is_hidden = $1 WHERE id = $2 RETURNING *',
      [is_hidden, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:id', validateId, async (req, res, next) => {
  try {
    const db = await connectDB();
    const result = await db.query('DELETE FROM comments WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;