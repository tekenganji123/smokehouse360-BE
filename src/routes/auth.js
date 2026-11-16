const bcrypt = require('bcryptjs')
const express = require('express')
const rateLimit = require('express-rate-limit')
const { requireAdmin } = require('../middleware/requireAdmin')
const { requireCashierSession, getStaffRole } = require('../middleware/requireStaff')
const { Cashier } = require('../models')
const { clean } = require('../utils/helpers')

const router = express.Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
})

let adminPasswordHash = null

async function initAdminAuth() {
  const pass = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  adminPasswordHash = await bcrypt.hash(pass, 10)
}

router.post('/login', loginLimiter, async (req, res) => {
  const username = clean(req.body.username)
  const password = String(req.body.password || '')
  const expectedUser = process.env.ADMIN_USERNAME || 'admin'
  if (!adminPasswordHash) await initAdminAuth()
  const ok =
    username === expectedUser && (await bcrypt.compare(password, adminPasswordHash))
  if (!ok) return res.status(401).json({ error: 'Incorrect username or password.' })
  delete req.session.cashier
  req.session.admin = { username }
  res.json({ ok: true, redirect: '/admin' })
})

router.post('/cashier/login', loginLimiter, async (req, res) => {
  const username = clean(req.body.username).toLowerCase()
  const password = String(req.body.password || '')
  if (!username || !password) {
    return res.status(400).json({ error: 'Enter username and password.' })
  }
  const cashier = await Cashier.findOne({ username })
  if (!cashier || !(await bcrypt.compare(password, cashier.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect username or password.' })
  }
  delete req.session.admin
  req.session.cashier = { id: cashier.id, username: cashier.username }
  res.json({
    ok: true,
    redirect: '/cashier',
    displayName: cashier.displayName || cashier.username,
  })
})

router.post('/logout', (req, res) => {
  if (!getStaffRole(req)) {
    return res.status(401).json({ error: 'Not signed in.' })
  }
  req.session.destroy(() => res.json({ ok: true }))
})

router.get('/admin/me', requireAdmin, (req, res) => {
  res.json({ username: req.session.admin.username, role: 'admin' })
})

router.get('/cashier/me', requireCashierSession, (req, res) => {
  res.json({
    username: req.session.cashier.username,
    id: req.session.cashier.id,
    role: 'cashier',
  })
})

module.exports = { router, initAdminAuth }