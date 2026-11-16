require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const { connectDB } = require('../config/db')
const seedOnStart = require('./seedOnStart')

async function seed() {
  await connectDB()
  await seedOnStart()
  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})