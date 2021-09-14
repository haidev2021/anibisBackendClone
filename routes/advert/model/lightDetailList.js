var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const { StatusCodes } = require('http-status-codes');
var DB_URL = 'mongodb://localhost:27017/';
const { ObjectId } = require('mongodb'); // or ObjectID 
const { fLog } = require('../../utils');
const { LIST_PROJECT, LIGHT_LIST_PROJECT, SORT_LATEST_FIRST, AdvertState, getLightDetailsByIds } = require('../../advertUtils');
const LATEST_OFFER_LIMIT = 8;

module.exports = {
    postHandlers: ['lastestOffers', 'searchResult'],
    lastestOffers: function (db, reqbody, callback) {
        let TAG = "lastestOffers";
        fLog(TAG, 'reqbody', reqbody);
        db.collection('advert')
            .find({ state: AdvertState.STATE_ACTIVE })
            .project(LIGHT_LIST_PROJECT)
            .limit(LATEST_OFFER_LIMIT)
            .sort(SORT_LATEST_FIRST)
            .toArray(function (err, result) {
                if (!err)
                    callback(result);
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
    },
    searchResult: function (db, { ids, lng }, callback) {
        let TAG = "searchResult";
        fLog(TAG, 'reqbody', { ids, lng });
        getLightDetailsByIds(db, ids, lng, LIST_PROJECT, callback, TAG);
    },
};