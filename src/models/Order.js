const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    reference: { type: String, required: true },
    customerId: { type: String, default: '' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'Pending verification' },
    orderStatus: { type: String, default: 'Received' },
    note: { type: String, default: '' },
    source: { type: String, default: 'online' },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Order', orderSchema)