const lightDetailList = require('./model/lightDetailList');
const idList = require('./model/idList');
const detail = require('./model/detail');
const searchCount = require('./model/searchCount');
const { getExportObject } = require('../utils');
const models = [detail, lightDetailList, idList, searchCount];
// (function initModels(models){})(models);
detail.notifyCreateIndexes();
module.exports = {
    route: 'advert',
    ...getExportObject(models)
};