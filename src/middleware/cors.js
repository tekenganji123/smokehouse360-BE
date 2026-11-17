const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

function configuredOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isAllowedOrigin(origin) {
  if (!origin) return false
  if (LOCAL_DEV_ORIGINS.includes(origin)) return true
  if (configuredOrigins().includes(origin)) return true
  if (
    (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
    /^https:\/\/smokehouse360[a-z0-9-]*\.vercel\.app$/i.test(origin)
  ) {
    return true
  }
  return false
}

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS')
    const requested = req.headers['access-control-request-headers']
    res.setHeader(
      'Access-Control-Allow-Headers',
      typeof requested === 'string' && requested.length > 0
        ? requested
        : 'Content-Type, Authorization'
    )
    res.setHeader('Access-Control-Max-Age', '86400')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
}

module.exports = { corsMiddleware, isAllowedOrigin }