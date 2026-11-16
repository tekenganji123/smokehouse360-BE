const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    reference: { type: String, required: true },
    customerId: { type: String, default: '' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    roomId: { type: String, required: true },
    roomName: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    guests: { type: Number, default: 1 },
    paymentMethod: { type: String, default: 'To be arranged' },
    status: { type: String, default: 'Pending confirmation' },
    source: { type: String, default: 'online' },
    createdAt: { type: String, required: true },
  },
  { timestamps: false }
)

module.exports = mongoose.model('Booking', bookingSchema)