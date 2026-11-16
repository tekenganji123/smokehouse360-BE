function getStaffRole(req) {
  if (req.session?.admin) return 'admin'
  if (req.session?.cashier) return 'cashier'
  return null
}

function requireStaff(req, res, next) {
  if (getStaffRole(req)) return next()
  return res.status(401).json({ error: 'Please log in as staff.' })
}

function requireCashierSession(req, res, next) {
  if (req.session?.cashier) return next()
  return res.status(403).json({ error: 'Cashier access only.' })
}

module.exports = { requireStaff, requireCashierSession, getStaffRole }