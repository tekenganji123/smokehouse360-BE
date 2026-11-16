const { Meal, Drink, Room } = require('../models')
const { clean, money } = require('../utils/helpers')

const COLLECTIONS = {
  meals: { Model: Meal, idPrefix: 'meal' },
  drinks: { Model: Drink, idPrefix: 'drink' },
  rooms: { Model: Room, idPrefix: 'room' },
}

function validateItem(body, type) {
  const name = clean(body.name)
  const price = money(body.price)
  if (!name) throw new Error('Name is required.')
  if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid price in FCFA.')
  return {
    name,
    price,
    description: clean(body.description),
    image: clean(body.image),
    category: clean(body.category) || (type === 'rooms' ? 'Room' : 'General'),
    features: clean(body.features),
    available: body.available !== 'false' && body.available !== false,
  }
}

async function getAdminSnapshot() {
  const { Order, Booking, Message } = require('../models')
  const { toPlainList } = require('../utils/helpers')
  const { getSettingsPlain } = require('./settings')

  const [meals, drinks, rooms, orders, bookings, messages, settings] = await Promise.all([
    Meal.find().sort({ _id: 1 }),
    Drink.find().sort({ _id: 1 }),
    Room.find().sort({ _id: 1 }),
    Order.find().sort({ createdAt: -1 }),
    Booking.find().sort({ createdAt: -1 }),
    Message.find().sort({ createdAt: -1 }),
    getSettingsPlain(),
  ])

  return {
    meals: toPlainList(meals),
    drinks: toPlainList(drinks),
    rooms: toPlainList(rooms),
    orders: toPlainList(orders),
    bookings: toPlainList(bookings),
    messages: toPlainList(messages),
    settings: settings || {
      social: { tiktok: '', instagram: '', x: '', whatsapp: '' },
      restaurantPhone: '',
      restaurantEmail: '',
      restaurantAddress: '',
      aboutText: '',
    },
  }
}

async function getCashierSnapshot() {
  const { Order, Booking } = require('../models')
  const { toPlainList } = require('../utils/helpers')

  const [meals, drinks, rooms, orders, bookings] = await Promise.all([
    Meal.find().sort({ _id: 1 }),
    Drink.find().sort({ _id: 1 }),
    Room.find().sort({ _id: 1 }),
    Order.find().sort({ createdAt: -1 }),
    Booking.find().sort({ createdAt: -1 }),
  ])

  return {
    meals: toPlainList(meals),
    drinks: toPlainList(drinks),
    rooms: toPlainList(rooms),
    orders: toPlainList(orders),
    bookings: toPlainList(bookings),
  }
}

module.exports = { COLLECTIONS, validateItem, getAdminSnapshot, getCashierSnapshot }