const multer = require('multer')
const path = require('path')
const { v4: uuid_v4 } = require('uuid');
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    var fileName = file.fieldname + '-' + uuid_v4() + path.extname(file.originalname)
    cb(null, fileName)
  }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    // Check mime
    const mimetype = filetypes.test(file.mimetype)

    if(extname && mimetype) {
        return cb(null, true)
    } else {
        cb('Error: File not an image')
    }
}

module.exports = {
    upload: multer({
        storage: storage,
        fileFilter: function(req, file, cb) {
            checkFileType(file, cb)
        }
    })
}