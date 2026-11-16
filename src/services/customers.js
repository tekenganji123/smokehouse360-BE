const { Customer } = require('../models')
const { clean, newId } = require('../utils/helpers')

const PLACEHOLDER_PHONES = new Set(['on-site', 'onsite', 'n/a', 'na', 'none'])

function normalizePhoneKey(phone) {
  const p = clean(phone)
  if (!p) return null
  const digits = p.replace(/\D/g, '')
  return digits.length >= 7 ? digits : null
}

function isTrackablePhone(phone) {
  const raw = clean(phone)
  if (!raw) return false
  if (PLACEHOLDER_PHONES.has(raw.toLowerCase())) return false
  if (!/^\+?[0-9\s()-]{7,18}$/.test(raw)) return false
  return Boolean(normalizePhoneKey(raw))
}

async function upsertCustomer({ name, phone, email }) {
  const phoneKey = normalizePhoneKey(phone)
  if (!phoneKey || !isTrackablePhone(phone)) {
    return null
  }

  const now = new Date().toISOString()
  const displayName = clean(name) || 'Customer'
  const displayPhone = clean(phone)
  const displayEmail = clean(email)

  let doc = await Customer.findOne({ phoneKey })
  if (doc) {
    if (displayName && displayName !== 'Customer' && displayName !== 'Walk-in customer') {
      doc.name = displayName
    }
    if (displayEmail) doc.email = displayEmail
    doc.phone = displayPhone
    doc.updatedAt = now
    doc.lastSeenAt = now
    await doc.save()
    return doc
  }

  doc = await Customer.create({
    id: newId('customer'),
    name: displayName,
    phone: displayPhone,
    phoneKey,
    email: displayEmail,
    notes: '',
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  })
  return doc
}

async function touchCustomer(customerId) {
  if (!customerId) return
  const now = new Date().toISOString()
  await Customer.updateOne({ id: customerId }, { $set: { lastSeenAt: now, updatedAt: now } })
}

/**
 * @param {{ customerId?: string, name?: string, customerName?: string, phone?: string, email?: string, defaultName?: string }} input
 */
async function resolveCustomerInput(input = {}) {
  const defaultName = input.defaultName || 'Walk-in customer'
  const inlineName = clean(input.customerName) || clean(input.name)
  const inlinePhone = clean(input.phone)
  const inlineEmail = clean(input.email)

  if (input.customerId) {
    const doc = await Customer.findOne({ id: clean(input.customerId) })
    if (!doc) {
      throw new Error('Customer profile not found. Clear the selection and try again.')
    }
    const name = inlineName || doc.name || defaultName
    const phone = inlinePhone || doc.phone || 'On-site'
    const email = inlineEmail || doc.email || ''
    await touchCustomer(doc.id)
    return { customerId: doc.id, name, phone, email }
  }

  const name = inlineName || defaultName
  const phone = inlinePhone || 'On-site'
  const email = inlineEmail || ''

  if (isTrackablePhone(phone)) {
    const doc = await upsertCustomer({ name, phone, email })
    if (doc) {
      return {
        customerId: doc.id,
        name: doc.name,
        phone: doc.phone,
        email: doc.email || '',
      }
    }
  }

  return { customerId: '', name, phone, email }
}

async function searchCustomers(query, limit = 50) {
  const q = clean(query)
  if (q) {
    const key = normalizePhoneKey(q)
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const or = [{ name: regex }, { phone: regex }, { email: regex }]
    if (key) or.push({ phoneKey: key }, { phoneKey: { $regex: key } })
    const filter = { $or: or }
    return Customer.find(filter).sort({ lastSeenAt: -1 }).limit(limit)
  }
  return Customer.find().sort({ lastSeenAt: -1 }).limit(limit)
}

module.exports = {
  normalizePhoneKey,
  isTrackablePhone,
  upsertCustomer,
  touchCustomer,
  resolveCustomerInput,
  searchCustomers,
}