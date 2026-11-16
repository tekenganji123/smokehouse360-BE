const express = require('express')
const { Order } = require('../models')
const { resolveOrderLines } = require('../services/orderLines')
const { upsertCustomer } = require('../services/customers')
const { clean, newId, toPlain } = require('../utils/helpers')

const router = express.Router()

router.post('/orders', async (req, res) => {
  const { customerName, phone, email, items, paymentMethod, note } = req.body || {}
  if (!clean(customerName) || !/^\+?[0-9\s()-]{7,18}$/.test(clean(phone))) {
    return res.status(400).json({ error: 'Enter your name and a valid phone number.' })
  }
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Your cart is empty.' })
  }
  if (!['mtn-momo', 'orange-money', 'virtual-card'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Choose a payment method.' })
  }

  let orderItems
  let total
  try {
    ;({ orderItems, total } = await resolveOrderLines(items, { requireAvailable: true }))
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }

  const customerDoc = await upsertCustomer({
    name: clean(customerName),
    phone: clean(phone),
    email: clean(email),
  })

  const orderPayload = {
    id: newId('order'),
    reference: `SH360-${Date.now().toString().slice(-8)}`,
    customerId: customerDoc?.id || '',
    customerName: clean(customerName),
    phone: clean(phone),
    email: clean(email),
    items: orderItems,
    total,
    paymentMethod,
    paymentStatus: 'Pending verification',
    orderStatus: 'Received',
    note: clean(note),
    source: 'online',
    createdAt: new Date().toISOString(),
  }

  const order = await Order.create(orderPayload)

  const payDetails =
    paymentMethod === 'mtn-momo'
      ? process.env.MTN_MOMO_NUMBER
        ? `Send ${total.toLocaleString('en-US')} FCFA to MTN MoMo ${process.env.MTN_MOMO_NUMBER} (${process.env.MTN_MOMO_NAME || 'SMOKEHOUSE 360'}). Include reference ${order.reference}.`
        : 'MTN MoMo merchant details have not yet been configured. Please contact the restaurant to complete payment.'
      : paymentMethod === 'orange-money'
        ? process.env.ORANGE_MONEY_NUMBER
          ? `Send ${total.toLocaleString('en-US')} FCFA to Orange Money ${process.env.ORANGE_MONEY_NUMBER} (${process.env.ORANGE_MONEY_NAME || 'SMOKEHOUSE 360'}). Include reference ${order.reference}.`
          : 'Orange Money merchant details have not yet been configured. Please contact the restaurant to complete payment.'
        : process.env.CARD_PAYMENT_URL
          ? 'Continue to the secure card payment provider.'
          : 'Secure virtual-card checkout is not connected yet. No card details have been collected. Please contact the restaurant to complete payment.'

  res.status(201).json({
    ok: true,
    order: toPlain(order),
    paymentInstructions: payDetails,
    cardCheckoutUrl: paymentMethod === 'virtual-card' ? process.env.CARD_PAYMENT_URL || '' : '',
  })
})

module.exports = router