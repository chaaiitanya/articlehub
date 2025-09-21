const { connectRedis } = require('../config/redis');
const crypto = require('crypto');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    keyPrefix = 'rl:'
  } = options;

  return async (req, res, next) => {
    try {
      const redis = await connectRedis();
      const ip = req.ip || req.connection.remoteAddress;
      const key = `${keyPrefix}${crypto.createHash('md5').update(ip).digest('hex')}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > max) {
        return res.status(429).json({
          error: 'Too many requests, please try again later'
        });
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - current);

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
};

module.exports = { createRateLimiter };