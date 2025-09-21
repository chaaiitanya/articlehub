const redis = require('redis');

let client;

const connectRedis = async () => {
  if (!client) {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    client.on('error', (err) => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis connected'));

    await client.connect();
  }

  return client;
};

module.exports = { connectRedis };