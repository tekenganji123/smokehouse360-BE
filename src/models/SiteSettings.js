const mongoose = require('mongoose')

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    social: {
      tiktok: { type: String, default: '' },
      instagram: { type: String, default: '' },
      x: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    restaurantPhone: { type: String, default: '' },
    restaurantEmail: { type: String, default: '' },
    restaurantAddress: { type: String, default: '' },
    aboutText: { type: String, default: '' },
  },
  { timestamps: false }
)

module.exports = mongoose.model('SiteSettings', siteSettingsSchema)