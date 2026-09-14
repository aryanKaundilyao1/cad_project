const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
// Assume a configured Redis client is exported from a central module
// const redisClient = require('../config/redis');

// Fallback to memory store if Redis is not configured in this stub
const getStore = () => {
    try {
        const redisClient = require('../config/redis');
        return new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
    } catch {
        return undefined; // Defaults to memory store
    }
};

/**
 * Global Rate Limiter
 * Limits standard endpoints to 1000 requests per 15 mins per IP.
 */
const globalLimiter = rateLimit({
    store: getStore(),
    windowMs: 15 * 60 * 1000, 
    max: 1000,
    message: { error: "Global rate limit exceeded. Please try again later." }
});

/**
 * Search & Lead API Limiter
 * Heavily restricts expensive data scraping queries to 100 requests per 15 mins.
 */
const searchLimiter = rateLimit({
    store: getStore(),
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: { error: "Too many search requests, please try again later." }
});

/**
 * Auth API Limiter
 * Prevents brute forcing by limiting auth attempts to 10 requests per 15 mins.
 */
const authLimiter = rateLimit({
    store: getStore(),
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: { error: "Too many authentication attempts, please try again later." }
});

module.exports = {
    globalLimiter,
    searchLimiter,
    authLimiter
};
