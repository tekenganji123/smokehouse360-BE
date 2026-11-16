const express = require('express')
const { getCashierSnapshot } = require('../services/catalog')
const { requireCashierSession } = require('../middleware/requireStaff')

const router = express.Router()

router.get('/cashier/data', requireCashierSession, async (_req, res) => {
  res.json(await getCashierSnapshot())
})

module.exports = router