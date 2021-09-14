// uploadMiddleware.js

const multer = require('multer');
const SAVE_ORIGINAL = true;
const upload = SAVE_ORIGINAL ? multer({
  dest: __dirname + '../../../uploads/original',
  // limits: {
  //   fileSize: 4 * 1024 * 1024,
  // }
}): 
multer({
  // dest: __dirname + '/uploads/original',
  // limits: {
  //   fileSize: 4 * 1024 * 1024,
  // }
});

module.exports = {saveOriginal: SAVE_ORIGINAL, upload: upload}