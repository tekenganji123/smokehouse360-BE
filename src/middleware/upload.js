const crypto = require('crypto')
const fs = require('fs')
const multer = require('multer')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const UPLOADS = path.join(ROOT, 'public', 'uploads')
fs.mkdirSync(UPLOADS, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${path.extname(file.originalname).toLowerCase()}`
    ),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Please upload a JPG, PNG, WEBP or GIF image.'))
  },
})

module.exports = { upload, UPLOADS_DIR: UPLOADS, ROOT }