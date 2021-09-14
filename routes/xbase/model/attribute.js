
const { checkLanguageSupported } = require("../../utils");
const { getCategoriesByIds } = require("./category");
const sqlhelper = require("./sqlhelper");
const { fLog } = require('../../utils');
var db = null;
const cacheMap = { search: { de: new Map(), fr: new Map(), it: new Map() }, insert: { de: new Map(), fr: new Map(), it: new Map() } };

/*function reorderForInsertVsSearch
    - is Search: reorder 1, 208 & 207 to top
    - is Insert:  208 to top & 207 & 1 to bottom*/
function reorderForInsertVsSearch(atts, isSearch) {
    if (isSearch) {
        const newMinSortOrder = (atts.length > 0 ? atts[0].sortOrder : 0) - 3;
        const calcSortOrder = a => a.id === 1 ? newMinSortOrder : (a.id === 207 ? newMinSortOrder + 1 : (a.id === 208 ? newMinSortOrder + 2 : a.sortOrder));
        atts.sort((a, b) => (calcSortOrder(a) - calcSortOrder(b)));
    } else {
        const newMinSortOrder = (atts.length > 0 ? atts[0].sortOrder : 0) - 1;
        const newMaxSortOrder = (atts.length > 0 ? atts[atts.length - 1].sortOrder : 0) + 2;
        const calcSortOrder = a => a.id === 208 ? newMinSortOrder : (a.id === 207 ? newMaxSortOrder - 1 : (a.id === 1 ? newMaxSortOrder : a.sortOrder));
        atts.sort((a, b) => (calcSortOrder(a) - calcSortOrder(b)));
    }
}
function getCacheMapEntry(lng, isSearch) {
    return cacheMap[isSearch ? "search" : "insert"][lng];
}
module.exports = {
    getHandlers: ['attributesByCatId'],
    setDatabase: function (_db) {
        let TAG = "setDatabase";
        db = _db;
        fLog(TAG, 'attributesByCatId setDatabase db', db);
    },
    attributesByCatId: function ({ id, lng, isSearch }, callback) {
        let TAG = "attributesByCatId";
        lng = checkLanguageSupported(lng);
        isSearch = isSearch === 'true';
        id = Number.parseInt(id);
        fLog(TAG, '/attributesByCatId { id, lng, isSearch }', { id, lng, isSearch })
        if (getCacheMapEntry(lng, isSearch).has(id)) {
            fLog(TAG, `cacheMap[${[lng]}] has `, id)
            callback(getCacheMapEntry(lng, isSearch).get(id));
        } else {
            (new Promise(function (resolve, error) {
                let attQuery = sqlhelper.queries.getAttIdsByCat(id, isSearch)
                fLog(TAG, 'attributesByCatId attQuery: ', attQuery);
                db.all(attQuery, function (err, atts) {
                    if (!err) {
                        reorderForInsertVsSearch(atts, isSearch);
                        fLog(TAG, `cacheMap[${[lng]}] set `, id)
                        fLog(TAG, `atts `, atts)
                        getCacheMapEntry(lng, isSearch).set(id, atts);
                        let [attMap, attWhereList] = sqlhelper.makeSQLWhereList(atts, "id");
                        resolve({ atts, attMap, attWhereList });
                    } else {
                        fLog(TAG, 'attQuery err', err)
                        callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                    }
                });
            })).then(function ({ atts, attMap, attWhereList }) {
                let attDetailQuery = sqlhelper.queries.getAttDetail(lng, attWhereList);
                fLog(TAG, 'attributesByCatId attDetailQuery: ', attDetailQuery)
                return new Promise(function (resolve, error) {
                    db.all(attDetailQuery, function (err, attDetails) {
                        if (!err) {
                            attDetails.map(attDetail => {
                                let att = attMap.get(attDetail.attributeId);
                                let { attributeId, ...idRemoved } = attDetail;
                                Object.assign(att, idRemoved);
                            });
                            let [attNumericRangeMap, numericRangeWhereList] = sqlhelper.makeSQLWhereList(atts, "numericRange");
                            resolve({ atts, attMap, attWhereList, attNumericRangeMap, numericRangeWhereList });
                        } else {
                            fLog(TAG, 'attDetailQuery err', err)
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                        }
                    });
                });
            }).then(function ({ atts, attMap, attWhereList, attNumericRangeMap, numericRangeWhereList }) {
                let attNumericRangeQuery = sqlhelper.queries.getNumericRange(numericRangeWhereList);
                fLog(TAG, 'attributesByCatId attNumericRangeQuery: ', attNumericRangeQuery)
                return new Promise(function (resolve, error) {
                    db.all(attNumericRangeQuery, function (err, attNumericRanges) {
                        if (!err) {
                            attNumericRanges.map(attNumericRange => {
                                let att = attNumericRangeMap.get(attNumericRange.numericRangeId);
                                att.numericRange = attNumericRange;
                            });
                            resolve({ atts, attMap, attWhereList });
                        } else {
                            fLog(TAG, 'attDetailQuery err', err)
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                        }
                    });
                });
            }).then(function ({ atts, attMap, attWhereList }) {
                let entriesQuery = sqlhelper.queries.getAttEntries(lng, attWhereList)
                fLog(TAG, 'attributesByCatId entriesQuery: ', entriesQuery)
                db.all(entriesQuery, function (err, entries) {
                    if (!err) {
                        entries.map(entry => {
                            let att = attMap.get(entry.attributeId);
                            if (!att.entries)
                                att.entries = [];
                            // let {attributeEntryID, attributeId, ...idRemoved} = entry;
                            att.entries.push(entry);
                        });
                        fLog(TAG, 'attributesByCatId atts: ', atts)
                        callback(atts);
                    } else {
                        fLog(TAG, 'entriesQuery err', err)
                        callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                    }
                });
            });
            // .catch(function(err){
            //     fLog(TAG, 'entriesQuery err', err)
            // });
        }
    },
}