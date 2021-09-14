const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { fLog } = require('../utils');
const SAVE_STORAGE = !true;
class Resize {
  constructor(folder, thumbnailfolder) {
    this.folder = folder;
    this.thumbnailfolder = thumbnailfolder;
    // fLog(TAG, "Resize folder = " + folder + " thumbnailfolder = " + folder);
  }

  async save(buffer) {
    const filename = Resize.filename();
    const filepath = this.filepath(filename);


    const thumbnailname = Resize.filename();
    const thumbnailpath = this.thumbnailpath(thumbnailname);

    await sharp(buffer)
      .resize(SAVE_STORAGE ? 60 : 768, SAVE_STORAGE ? 80 : 1024, {//200, 200, { // 
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .toFile(filepath);

    await sharp(buffer)
      .resize(SAVE_STORAGE ? 160 : 200, SAVE_STORAGE ? 120 : 150, { // 
        fit: sharp.fit.cover,
        withoutEnlargement: true,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      })
      .toFile(thumbnailpath);

    return { blogPhotosResized: filename, blogPhotosThumbnail: thumbnailname };
  }
  static filename() {
    // random file name
    return `${uuidv4()}.png`;
  }
  filepath(filename) {
    return path.resolve(`${this.folder}/${filename}`)
  }
  thumbnailpath(filename) {
    return path.resolve(`${this.thumbnailfolder}/${filename}`)
  }
}

module.exports = Resize;