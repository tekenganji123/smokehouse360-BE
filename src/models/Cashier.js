const mongoose = require('mongoose')

const cashierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: '' },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Cashier', cashierSchema)