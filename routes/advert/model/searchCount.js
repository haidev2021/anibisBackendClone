
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var DB_URL = 'mongodb://localhost:27017/';
const { ObjectId } = require('mongodb'); // or ObjectID 
const { parseSearchQuery } = require('../helper/queryParser');
const { getUserByIdPromise, AdvertState } = require('../../advertUtils');
const { getCategoryIdPath } = require('../../xbase/model/category');
const { StatusCodes } = require('http-status-codes');
const { fLog } = require('../../utils');
/*
  { categoryIdPath: [ 4, 72 ], count: 2 },
  { categoryIdPath: [ 4, 113 ], count: 1 },
  { categoryIdPath: [ 4, 71 ], count: 1 }
  ===>
  { id: 4, count: 4 },
  { id: 72, count: 2 },
  { id: 113, count: 1 },
  { id: 71, count: 1 }
*/
function groupSum(array) {
    let idPosMap = new Map();
    let total = 0;
    const reducer = (acc, cur) => {
        if (cur.categoryIdPath) {
            cur.categoryIdPath.map(catId => {
                let checkPos = idPosMap.get(catId);
                if (checkPos !== undefined)
                    acc[checkPos].count += cur.count;
                else {
                    idPosMap.set(catId, acc.length);
                    acc.push({ id: catId, count: cur.count });
                }
            })
            total += cur.count;
        }
        return acc;
    }
    let result = array.reduce(reducer, []);
    result.unshift({ id: 0, count: total })
    return result;
}

module.exports = {
    postHandlers: ['searchCount'],
    searchCount: function (db, { query }, callback) {
        let TAG = "searchCount";
        fLog(TAG, 'reqbody', query);
        const queryObj = parseSearchQuery(query);
        getCategoryIdPath(queryObj.findObj.categoryPath, categoryPath => {
            if (categoryPath.length > 0) {
                const categoryIdPath = Array.from(categoryPath, item => item.id);
                queryObj.findObj.categoryPath = { $in: categoryIdPath }
            }
            const cursor = db.collection('advert').aggregate([
                { $match: { ...queryObj.findObj, state: AdvertState.STATE_ACTIVE } },
                { $group: { _id: "$categoryPath", count: { $sum: 1 } } }
            ]);
            cursor.toArray(function (err, docs) {
                if (!err) {
                    // fLog(TAG, 'docs', docs);
                    const countByAdsCatPath = Array.from(docs, item => ({ categoryIdPath: item._id, count: item.count }));
                    const result = groupSum(countByAdsCatPath);
                    fLog(TAG, 'result', result);
                    callback(result);
                } else {
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        });
    },
}