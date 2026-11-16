const { Meal, Drink } = require('../models')

async function resolveOrderLines(items, { requireAvailable = true } = {}) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Add at least one menu item.')
  }

  const [meals, drinks] = await Promise.all([Meal.find(), Drink.find()])
  const catalog = [...meals, ...drinks]

  let total = 0
  const orderItems = []

  for (const line of items) {
    const found = catalog.find((x) => x.id === line.id && (!requireAvailable || x.available))
    const qty = Math.max(1, Math.min(50, parseInt(line.quantity, 10) || 1))
    if (!found) {
      throw new Error('One of the selected items is unavailable. Refresh and try again.')
    }
    total += found.price * qty
    orderItems.push({ id: found.id, name: found.name, price: found.price, quantity: qty })
  }

  return { orderItems, total }
}

module.exports = { resolveOrderLines }