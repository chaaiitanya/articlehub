const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { validateComment, validateId } = require('../utils/validators');
const { createRateLimiter } = require('../middleware/rateLimit');
const moderationService = require('../services/moderation');
const crypto = require('crypto');

const commentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyPrefix: 'comment:'
});

router.get('/article/:id', validateId, async (req, res, next) => {
  try {
    const db = await connectDB();
    const result = await db.query(
      'SELECT * FROM comments WHERE article_id = $1 AND is_hidden = false ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/article/:id',
  validateId,
  commentRateLimiter,
  validateComment,
  async (req, res, next) => {
    try {
      const { content, author_name = 'Anonymous' } = req.body;
      const articleId = req.params.id;
      const ip = req.ip || req.connection.remoteAddress;
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

      const moderationResult = await moderationService.moderateComment(content, {
        author_name,
        ip_hash: ipHash
      });

      const db = await connectDB();

      const result = await db.query(
        `INSERT INTO comments
        (article_id, author_name, content, ip_hash, is_hidden, is_flagged, moderation_score, moderation_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          articleId,
          author_name,
          content,
          ipHash,
          moderationResult.shouldHide,
          moderationResult.isToxic || moderationResult.isSpam,
          moderationResult.score,
          moderationResult.reason
        ]
      );

      const comment = result.rows[0];

      if (moderationResult.shouldHide) {
        res.status(200).json({
          message: 'Your comment has been submitted for review',
          status: 'pending'
        });
      } else {
        res.status(201).json(comment);
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;