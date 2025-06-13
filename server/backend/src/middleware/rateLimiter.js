const { RateLimiterMemory } = require('rate-limiter-flexible')

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'm5stick-power-logger',
  points: 100,
  duration: 60,
  blockDuration: 60
})

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip
    await rateLimiter.consume(key)
    next()
  } catch (rejRes) {
    const remainingPoints = rejRes.remainingPoints || 0
    const msBeforeNext = rejRes.msBeforeNext || 1000

    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': 100,
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString()
    })

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000)
    })
  }
}

module.exports = rateLimiterMiddleware