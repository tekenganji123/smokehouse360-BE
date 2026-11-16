const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    message: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Message', messageSchema)