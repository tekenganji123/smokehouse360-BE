const { SiteSettings } = require('../models')
const { toPlain } = require('../utils/helpers')

async function getSettingsDoc() {
  return SiteSettings.findOne({ key: 'default' })
}

async function getSettingsPlain() {
  const doc = await getSettingsDoc()
  if (!doc) return null
  const plain = toPlain(doc)
  delete plain.key
  return plain
}

function withPayment(settings) {
  const base = settings || {
    social: { tiktok: '', instagram: '', x: '', whatsapp: '' },
    restaurantPhone: '',
    restaurantEmail: '',
    restaurantAddress: '',
    aboutText: '',
  }
  return {
    ...base,
    payment: {
      mtnNumber: process.env.MTN_MOMO_NUMBER || '',
      mtnName: process.env.MTN_MOMO_NAME || 'SMOKEHOUSE 360',
      orangeNumber: process.env.ORANGE_MONEY_NUMBER || '',
      orangeName: process.env.ORANGE_MONEY_NAME || 'SMOKEHOUSE 360',
      cardReady: Boolean(process.env.CARD_PAYMENT_URL),
    },
  }
}

async function safeSettings() {
  const settings = await getSettingsPlain()
  return withPayment(settings)
}

module.exports = { getSettingsDoc, getSettingsPlain, safeSettings, withPayment }