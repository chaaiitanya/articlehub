const { body, query, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.type = 'validation';
    err.errors = errors.array();
    return next(err);
  }
  next();
};

const validateArticle = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
  body('content').notEmpty().trim(),
  body('published').optional().isBoolean(),
  handleValidationErrors
];

const validateComment = [
  body('content').notEmpty().trim().isLength({ min: 1, max: 5000 }),
  body('author_name').optional().trim().isLength({ max: 100 }),
  handleValidationErrors
];

const validateSearch = [
  query('q').notEmpty().trim().isLength({ min: 1, max: 200 }),
  query('type').optional().isIn(['articles', 'comments', 'all']),
  handleValidationErrors
];

const validateId = [
  param('id').isInt({ min: 1 }),
  handleValidationErrors
];

module.exports = {
  validateArticle,
  validateComment,
  validateSearch,
  validateId
};