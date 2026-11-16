const express = require('express')
const { Room, Booking } = require('../models')
const { upsertCustomer } = require('../services/customers')
const { clean, newId, toPlain } = require('../utils/helpers')

const router = express.Router()

router.post('/bookings', async (req, res) => {
  const b = req.body || {}
  const guests = Math.max(1, Math.min(20, parseInt(b.guests, 10) || 1))
  const room = await Room.findOne({ id: b.roomId, available: true })
  if (
    !room ||
    !clean(b.name) ||
    !/^\+?[0-9\s()-]{7,18}$/.test(clean(b.phone)) ||
    !clean(b.checkIn) ||
    !clean(b.checkOut) ||
    b.checkOut <= b.checkIn
  ) {
    return res.status(400).json({
      error: 'Please complete all booking fields and choose valid dates and an available room.',
    })
  }

  const customerDoc = await upsertCustomer({
    name: clean(b.name),
    phone: clean(b.phone),
    email: clean(b.email),
  })

  const booking = await Booking.create({
    id: newId('booking'),
    reference: `ROOM-${Date.now().toString().slice(-8)}`,
    customerId: customerDoc?.id || '',
    name: clean(b.name),
    phone: clean(b.phone),
    email: clean(b.email),
    roomId: room.id,
    roomName: room.name,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests,
    paymentMethod: clean(b.paymentMethod) || 'To be arranged',
    status: 'Pending confirmation',
    source: 'online',
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ ok: true, booking: toPlain(booking) })
})

module.exports = router