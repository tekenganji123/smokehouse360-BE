const bcrypt = require('bcryptjs')
const express = require('express')
const { requireAdmin } = require('../middleware/requireAdmin')
const { requireStaff } = require('../middleware/requireStaff')
const { upload } = require('../middleware/upload')
const { COLLECTIONS, validateItem, getAdminSnapshot } = require('../services/catalog')
const { getSettingsDoc, getSettingsPlain } = require('../services/settings')
const { Order, Booking, Message, Room, Customer, Cashier } = require('../models')
const { resolveOrderLines } = require('../services/orderLines')
const {
  normalizePhoneKey,
  isTrackablePhone,
  resolveCustomerInput,
  searchCustomers,
} = require('../services/customers')
const { clean, newId, toPlain, toPlainList } = require('../utils/helpers')

const ONSITE_PAYMENT_METHODS = ['cash', 'card-pos', 'mtn-momo', 'orange-money', 'transfer', 'other']

const router = express.Router()

router.get('/admin/data', requireAdmin, async (_req, res) => {
  res.json(await getAdminSnapshot())
})

for (const type of ['meals', 'drinks', 'rooms']) {
  const { Model, idPrefix } = COLLECTIONS[type]

  router.post(`/admin/${type}`, requireAdmin, upload.single('photo'), async (req, res) => {
    try {
      const fields = validateItem(req.body, type)
      const id = newId(idPrefix)
      const image = req.file ? `/uploads/${req.file.filename}` : fields.image
      const doc = await Model.create({ ...fields, id, image })
      res.status(201).json(toPlain(doc))
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  router.put(`/admin/${type}/:id`, requireAdmin, upload.single('photo'), async (req, res) => {
    try {
      const doc = await Model.findOne({ id: req.params.id })
      if (!doc) return res.status(404).json({ error: 'Item not found.' })
      const fields = validateItem(req.body, type)
      Object.assign(doc, fields)
      if (req.file) doc.image = `/uploads/${req.file.filename}`
      await doc.save()
      res.json(toPlain(doc))
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  router.delete(`/admin/${type}/:id`, requireAdmin, async (req, res) => {
    const result = await Model.deleteOne({ id: req.params.id })
    if (!result.deletedCount) return res.status(404).json({ error: 'Item not found.' })
    res.json({ ok: true })
  })
}

router.patch('/admin/:collection/:id/availability', requireAdmin, async (req, res) => {
  if (!['meals', 'drinks', 'rooms'].includes(req.params.collection)) {
    return res.status(404).json({ error: 'Not found.' })
  }
  const { Model } = COLLECTIONS[req.params.collection]
  const doc = await Model.findOne({ id: req.params.id })
  if (!doc) return res.status(404).json({ error: 'Not found.' })
  doc.available = Boolean(req.body.available)
  await doc.save()
  res.json(toPlain(doc))
})

router.put('/admin/settings', requireAdmin, async (req, res) => {
  const s = req.body || {}
  const doc = await getSettingsDoc()
  if (!doc) return res.status(500).json({ error: 'Settings not initialized. Run npm run seed.' })
  doc.social = {
    tiktok: clean(s.tiktok),
    instagram: clean(s.instagram),
    x: clean(s.x),
    whatsapp: clean(s.whatsapp),
  }
  doc.restaurantPhone = clean(s.restaurantPhone)
  doc.restaurantEmail = clean(s.restaurantEmail)
  doc.restaurantAddress = clean(s.restaurantAddress)
  doc.aboutText = clean(s.aboutText)
  await doc.save()
  const settings = await getSettingsPlain()
  res.json({ ok: true, settings })
})

router.get('/admin/cashiers', requireAdmin, async (_req, res) => {
  const docs = await Cashier.find().sort({ createdAt: -1 })
  res.json({
    cashiers: docs.map((c) => ({
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      createdAt: c.createdAt,
    })),
  })
})

router.post('/admin/cashiers', requireAdmin, async (req, res) => {
  const username = clean(req.body.username).toLowerCase()
  const password = String(req.body.password || '')
  const displayName = clean(req.body.displayName)
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  const taken = await Cashier.findOne({ username })
  if (taken) return res.status(409).json({ error: 'This username is already taken.' })
  const passwordHash = await bcrypt.hash(password, 10)
  const doc = await Cashier.create({
    id: newId('cashier'),
    username,
    passwordHash,
    displayName,
    createdAt: new Date().toISOString(),
  })
  res.status(201).json({
    id: doc.id,
    username: doc.username,
    displayName: doc.displayName,
    createdAt: doc.createdAt,
  })
})

router.delete('/admin/cashiers/:id', requireAdmin, async (req, res) => {
  const result = await Cashier.deleteOne({ id: req.params.id })
  if (!result.deletedCount) return res.status(404).json({ error: 'Cashier not found.' })
  res.json({ ok: true })
})

router.get('/admin/customers', requireStaff, async (req, res) => {
  const docs = await searchCustomers(req.query.q)
  res.json({ customers: toPlainList(docs) })
})

router.patch('/admin/customers/:id', requireAdmin, async (req, res) => {
  const doc = await Customer.findOne({ id: req.params.id })
  if (!doc) return res.status(404).json({ error: 'Customer not found.' })

  const name = clean(req.body.name)
  const phone = clean(req.body.phone)
  const email = clean(req.body.email)
  const notes = clean(req.body.notes)

  if (name) doc.name = name
  if (phone) {
    if (!isTrackablePhone(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number for this customer.' })
    }
    const phoneKey = normalizePhoneKey(phone)
    const taken = await Customer.findOne({ phoneKey, id: { $ne: doc.id } })
    if (taken) return res.status(409).json({ error: 'Another customer already uses this phone number.' })
    doc.phone = phone
    doc.phoneKey = phoneKey
  }
  if (req.body.email !== undefined) doc.email = email
  if (req.body.notes !== undefined) doc.notes = notes

  const now = new Date().toISOString()
  doc.updatedAt = now
  await doc.save()
  res.json(toPlain(doc))
})

router.delete('/admin/customers/:id', requireAdmin, async (req, res) => {
  const result = await Customer.deleteOne({ id: req.params.id })
  if (!result.deletedCount) return res.status(404).json({ error: 'Customer not found.' })
  res.json({ ok: true })
})

router.post('/admin/onsite-orders', requireStaff, async (req, res) => {
  const b = req.body || {}
  const paymentMethod = clean(b.paymentMethod)

  if (!ONSITE_PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Choose how the customer paid.' })
  }

  let customer
  try {
    customer = await resolveCustomerInput({
      customerId: b.customerId,
      customerName: b.customerName,
      phone: b.phone,
      email: b.email,
      defaultName: 'Walk-in customer',
    })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }

  let orderItems
  let total
  try {
    ;({ orderItems, total } = await resolveOrderLines(b.items, { requireAvailable: false }))
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }

  const paymentStatus = clean(b.paymentStatus) || 'Paid'
  const orderStatus = clean(b.orderStatus) || 'Completed'

  const order = await Order.create({
    id: newId('order'),
    reference: `POS-${Date.now().toString().slice(-8)}`,
    customerId: customer.customerId,
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
    items: orderItems,
    total,
    paymentMethod,
    paymentStatus,
    orderStatus,
    note: clean(b.note),
    source: 'onsite',
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ ok: true, order: toPlain(order) })
})

router.post('/admin/onsite-bookings', requireStaff, async (req, res) => {
  const b = req.body || {}
  const guests = Math.max(1, Math.min(20, parseInt(b.guests, 10) || 1))
  const room = await Room.findOne({ id: b.roomId })
  if (!room || !clean(b.checkIn) || !clean(b.checkOut) || b.checkOut <= b.checkIn) {
    return res.status(400).json({
      error: 'Choose a room and valid check-in and check-out dates.',
    })
  }

  let customer
  try {
    customer = await resolveCustomerInput({
      customerId: b.customerId,
      name: b.name,
      phone: b.phone,
      email: b.email,
      defaultName: 'Walk-in guest',
    })
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }

  const booking = await Booking.create({
    id: newId('booking'),
    reference: `DESK-${Date.now().toString().slice(-8)}`,
    customerId: customer.customerId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    roomId: room.id,
    roomName: room.name,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests,
    paymentMethod: clean(b.paymentMethod) || 'Cash at reception',
    status: clean(b.status) || 'Confirmed',
    source: 'onsite',
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ ok: true, booking: toPlain(booking) })
})

router.patch('/admin/orders/:id', requireStaff, async (req, res) => {
  const doc = await Order.findOne({ id: req.params.id })
  if (!doc) return res.status(404).json({ error: 'Order not found.' })
  if (req.body.paymentStatus) doc.paymentStatus = clean(req.body.paymentStatus)
  if (req.body.orderStatus) doc.orderStatus = clean(req.body.orderStatus)
  await doc.save()
  res.json(toPlain(doc))
})

router.patch('/admin/bookings/:id', requireStaff, async (req, res) => {
  const doc = await Booking.findOne({ id: req.params.id })
  if (!doc) return res.status(404).json({ error: 'Booking not found.' })
  doc.status = clean(req.body.status) || doc.status
  await doc.save()
  res.json(toPlain(doc))
})

router.delete('/admin/messages/:id', requireAdmin, async (req, res) => {
  const result = await Message.deleteOne({ id: req.params.id })
  if (!result.deletedCount) return res.status(404).json({ error: 'Message not found.' })
  res.json({ ok: true })
})

module.exports = router