const mongoose = require('mongoose')

const drinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Drink', drinkSchema)