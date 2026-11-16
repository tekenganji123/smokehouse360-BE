const crypto = require('crypto')

const clean = (value) => String(value ?? '').trim()
const money = (n) => Number(n)
const newId = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex')}`

function toPlain(doc) {
  if (!doc) return null
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  delete o._id
  delete o.__v
  return o
}

function toPlainList(docs) {
  return docs.map(toPlain)
}

module.exports = { clean, money, newId, toPlain, toPlainList }