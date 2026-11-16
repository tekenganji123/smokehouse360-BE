const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    phoneKey: { type: String, unique: true, sparse: true },
    email: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    lastSeenAt: { type: String, required: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Customer', customerSchema)