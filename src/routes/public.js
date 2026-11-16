const express = require('express')
const { Meal, Drink, Room } = require('../models')
const { toPlainList } = require('../utils/helpers')
const { safeSettings } = require('../services/settings')

const router = express.Router()

router.get('/public', async (_req, res) => {
  const [meals, drinks, rooms, settings] = await Promise.all([
    Meal.find({ available: true }),
    Drink.find({ available: true }),
    Room.find({ available: true }),
    safeSettings(),
  ])
  res.json({
    meals: toPlainList(meals),
    drinks: toPlainList(drinks),
    rooms: toPlainList(rooms),
    settings,
  })
})

router.get('/public/meals', async (_req, res) => {
  const meals = await Meal.find({ available: true })
  res.json(toPlainList(meals))
})

router.get('/public/drinks', async (_req, res) => {
  const drinks = await Drink.find({ available: true })
  res.json(toPlainList(drinks))
})

router.get('/public/rooms', async (_req, res) => {
  const rooms = await Room.find({ available: true })
  res.json(toPlainList(rooms))
})

module.exports = router