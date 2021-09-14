var express = require('express');
var path = require('path');

const router = express.Router();

const uploadMw = require('./uploadmiddleware');
const Resize = require('./resize');
const config = require('../../config');
const { fLog } = require('../utils');

router.get('/', function (req, res) {
    res.send('GET handler for /home route.');
});

router.post('/upload', uploadMw.upload.single('selectedPhotoBinary'), async function (req, res) {
    let TAG = "upload";
    fLog(TAG, "upload req.file = ", req.file);
    // folder upload
    const imagePath = path.join(__dirname, '../../static/blogPhotosResized');
    const thumbnailPath = path.join(__dirname, '../../static/blogPhotosThumbnail');
    // call class Resize
    const fileUpload = new Resize(imagePath, thumbnailPath);
    if (!req.file) {
        res.status(401).json({ error: 'Please provide an image' });
    }
    let files = null;
    try {
        files = await fileUpload.save(uploadMw.saveOriginal ? req.file.path : req.file.buffer);
        fLog(TAG, "upload filename = ", files);
    } catch (error) {
        fLog(TAG, "upload error = ", error);
    }
    // while(true) {}
    if (files)
        return config.SIMPLE_IMG_UPLOAD_RESPONSE ? res.end('success') : res.status(200).json(files);
    else
        return res.status(401).json({ error: 'Image upload fail' });
});

router.post('/del', uploadMw.upload.single('photo'), async function (req, res) {
    return res.status(200).end('del');
});
module.exports = router;