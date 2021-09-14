const category = require('./model/category');
const attribute = require('./model/attribute');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const country = require('./model/country');
const location = require('./model/location');
const textResource = require('./model/textResource');
const {fLog, getExportObject} = require('../utils');
let xbasedb = new sqlite3.Database(path.resolve(__dirname, './db/xbase.sqlite'), sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the xbase database.');
  }
});

let textdb = new sqlite3.Database(path.resolve(__dirname, './db/textresources.sqlite'), sqlite3.OPEN_READWRITE/*OPEN_READONLY*/, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the textresources database.');
  }
});

const xbaseDbModels = [category, attribute, country];
const textDbModels = [textResource];
const others = [location];
/*init db for models*/

function initModels(models, db) {
  models.map(model => {
    model.setDatabase(db);
    if (model.updateDB)
      model.updateDB();
  })
};

initModels(xbaseDbModels, xbasedb);
initModels(textDbModels, textdb);

module.exports = {
  route: "xbase",
  ...getExportObject([...xbaseDbModels, ...textDbModels, ...others])
};