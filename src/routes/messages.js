const express = require('express')
const { Message } = require('../models')
const { clean, newId } = require('../utils/helpers')

const router = express.Router()

router.post('/messages', async (req, res) => {
  const m = req.body || {}
  if (
    !clean(m.name) ||
    !clean(m.message) ||
    !/^\+?[0-9\s()-]{7,18}$/.test(clean(m.phone))
  ) {
    return res.status(400).json({ error: 'Please enter your name, a valid phone number and a message.' })
  }

  await Message.create({
    id: newId('message'),
    name: clean(m.name),
    phone: clean(m.phone),
    email: clean(m.email),
    message: clean(m.message),
    createdAt: new Date().toISOString(),
  })

  res.status(201).json({ ok: true })
})

module.exports = router