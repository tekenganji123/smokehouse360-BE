require('dotenv').config()
const express = require('express')
const session = require('express-session')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const { connectDB } = require('./config/db')
const { UPLOADS_DIR } = require('./middleware/upload')
const { corsMiddleware } = require('./middleware/cors')
const publicRoutes = require('./routes/public')
const { router: authRoutes, initAdminAuth } = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const cashierRoutes = require('./routes/cashier')
const orderRoutes = require('./routes/orders')
const bookingRoutes = require('./routes/bookings')
const messageRoutes = require('./routes/messages')
const seedOnStart = require('./seed/seedOnStart')

const app = express()
const PORT = Number(process.env.PORT || 3000)
const crossOriginFrontend =
  Boolean(process.env.VERCEL) ||
  Boolean((process.env.CORS_ORIGINS || '').trim()) ||
  process.env.TRUST_CROSS_ORIGIN === 'true'

if (process.env.VERCEL) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(corsMiddleware)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(
  session({
    name: 'smokehouse.sid',
    secret: process.env.SESSION_SECRET || 'development-only-change-this-session-secret-please',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: crossOriginFrontend ? 'none' : 'lax',
      secure: crossOriginFrontend,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
)
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/health', (_req, res) => res.json({ ok: true, app: 'Smokehouse 360' }))

app.use('/api', publicRoutes)
app.use('/api', authRoutes)
app.use('/api', adminRoutes)
app.use('/api', cashierRoutes)
app.use('/api', orderRoutes)
app.use('/api', bookingRoutes)
app.use('/api', messageRoutes)

const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist')
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/uploads')) {
      return next()
    }
    return res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

app.use((err, _req, res, next) => {
  console.error(err.message)
  if (res.headersSent) return next(err)
  res.status(400).json({ error: err.message || 'Something went wrong.' })
})

async function start() {
  await connectDB()
  await initAdminAuth()
  if (process.env.SEED_ON_START === 'true') await seedOnStart()
  app.listen(PORT, () => console.log(`Smokehouse 360 API at http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})