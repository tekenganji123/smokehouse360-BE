const initialData = require('./initialData')
const { Meal, Drink, Room, SiteSettings } = require('../models')

async function upsertCatalog(Model, items) {
  let created = 0
  for (const item of items) {
    const result = await Model.updateOne({ id: item.id }, { $setOnInsert: item }, { upsert: true })
    if (result.upsertedCount) created += 1
  }
  return created
}

async function seedOnStart() {
  const mealCreated = await upsertCatalog(Meal, initialData.meals)
  const drinkCreated = await upsertCatalog(Drink, initialData.drinks)
  const roomCreated = await upsertCatalog(Room, initialData.rooms)

  const settingsResult = await SiteSettings.updateOne(
    { key: 'default' },
    { $setOnInsert: initialData.settings },
    { upsert: true }
  )
  const settingsCreated = settingsResult.upsertedCount ? 1 : 0

  console.log(
    `Seed on start: meals +${mealCreated}, drinks +${drinkCreated}, rooms +${roomCreated}, settings +${settingsCreated}`
  )
}

module.exports = seedOnStart