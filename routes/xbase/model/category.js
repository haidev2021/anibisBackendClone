const { StatusCodes } = require("http-status-codes");
const { checkLanguageSupported, fLog } = require("../../utils");
const sqlhelper = require("./sqlhelper");
var db = null;
const subCatMap = { de: new Map(), fr: new Map(), it: new Map() };
const categoryMap = { de: new Map(), fr: new Map(), it: new Map() };
const SPECIAL_CATS = null;//[16, 2, 4, 6, 14, 15];//[6];//
function isForceSpecialCats() {
    return SPECIAL_CATS && SPECIAL_CATS.length > 0;
}
function getCategoryByIdAsParentIdRecursive(lng, id, resultArray, callback) {
    let TAG = "getCategoryByIdAsParentIdRecursive";
    lng = checkLanguageSupported(lng);
    let found = null;
    if (!id) {
        fLog(TAG, 'resultArray', resultArray)
        if (callback)
            callback(resultArray);
    } else {
        if (categoryMap[lng].has(id)) {
            fLog(TAG, `categoryMap[${lng}] has `, id)
            found = categoryMap[lng].get(id);
            resultArray.unshift(found);
            getCategoryByIdAsParentIdRecursive(lng, found.parentId, resultArray, callback);
        } else {
            let query = sqlhelper.queries.getCategory(id, lng);
            fLog(TAG, 'query', query)
            db.all(query, function (err, rows) {
                if (!err) {
                    if (rows && rows.length == 1) {
                        found = rows[0];
                        categoryMap[lng].set(id, rows[0]);
                        resultArray.unshift(found);
                        getCategoryByIdAsParentIdRecursive(lng, found.parentId, resultArray, callback);
                    } else
                        getCategoryByIdAsParentIdRecursive(lng, null, resultArray, callback);
                } else {
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        }
    }
}

module.exports = {
    getHandlers: ['getSubCategories', 'getCategoriesByIds', 'getCategoryPathById'],
    setDatabase: function (_db) {
        db = _db;;
    },
    getSubCategories: function ({ id, lng }, callback) {
        let TAG = "getSubCategories";
        fLog(TAG, { id, lng })
        lng = checkLanguageSupported(lng);
        if (!isForceSpecialCats() && subCatMap[lng].has(id)) {
            fLog(TAG, `subCatMap[${lng}] has `, id)
            callback({ subCategories: subCatMap[lng].get(id) });
        } else {
            let query = sqlhelper.queries.getSubCategories(id, lng);
            fLog(TAG, 'query', query)
            db.all(query, function (err, rows) {
                if (!err) {
                    fLog(TAG, 'set ', id)
                    subCatMap[lng].set(id, rows);
                    if (!id && isForceSpecialCats()) {
                        rows = rows.filter((row) => (SPECIAL_CATS.includes(row.id)));
                        subCatMap[lng].set(id, rows);
                    }
                    callback({ subCategories: rows });
                } else {
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        }
    },
    getCategoriesByIds: function ({ ids, lng }, callback) {
        let TAG = "getCategoriesByIds";
        lng = checkLanguageSupported(lng);
        let query = sqlhelper.queries.getCategoriesByIds(ids, lng);
        fLog(TAG, 'query', query)
        db.all(query, function (err, rows) {
            if (!err) {
                fLog(TAG, 'rows ', rows);
                callback(rows);
            } else {
                callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    },
    getCategoryPathById: function ({ id, lng }, callback) {
        let TAG = "getCategoryPathById";
        let resultArray = [];
        getCategoryByIdAsParentIdRecursive(lng, id, resultArray, callback);
    },
    getCategoryIdPath: function (childId, callback) {
        let TAG = "getCategoryIdPath";
        if (!childId)
            callback([]);
        else {
            let resultArray = [];
            getCategoryByIdAsParentIdRecursive("de", childId, resultArray, callback);
        }
    },
}