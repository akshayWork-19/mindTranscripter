const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 'fail',
        message: 'Too many requests for this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
})

const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {
        status: 'fail',
        message: 'Too many AI requests from this IP, please try again in an hour'
    }
});

module.exports = {
    apiLimiter, aiLimiter
}