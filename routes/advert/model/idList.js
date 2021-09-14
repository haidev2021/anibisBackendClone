var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const { StatusCodes } = require('http-status-codes');
var DB_URL = 'mongodb://localhost:27017/';
const { ObjectId } = require('mongodb'); // or ObjectID 
const { getUserByIdPromise, AdvertState } = require('../../advertUtils');
const { SORT_LATEST_FIRST, SORT_OLDEST_FIRST, SORT_LAST_MODIFIED_FIRST } = require('../../advertUtils');
const { parseSearchQuery } = require('../helper/queryParser');
const { fLog } = require('../../utils');

function handleIdListCurrsor(currsor, sortObj, callback, tag) {
    let TAG = "handleIdListCurrsor";
    fLog(TAG, `${tag} sortObj`, sortObj)
    currsor.project({ _id: 1 })
        .sort(sortObj)
        .toArray(function (err, result) {
            fLog(TAG, `${tag} result.length`, result.length)
            if (!err) {
                let onlyIds = result && Array.from(result, item => item._id) || [];
                fLog(TAG, `${tag} onlyIds`, onlyIds)
                callback(onlyIds);
            } else {
                callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
}

module.exports = {
    postHandlers: ['search', 'myAdvertIds', 'myAdvertIdsForAdmin', 'favoriteIds', 'userAdverts', 'gallery',],
    authorizedAPIs: ['myAdvertIds', 'myAdvertIdsForAdmin', 'favoriteIds'],
    favoriteIds: function (db, reqbody, userId, callback) {
        let TAG = "favoriteIds";
        fLog(TAG, 'reqbody', userId);
        db.collection('favorite').find({ userId: userId }).sort(SORT_LATEST_FIRST).toArray(function (err, result) {
            fLog(TAG, "result", result)
            if (!err)
                callback(Array.from(result, item => item.advertId));
            else
                callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
        });
    },
    search: function (db, { query }, callback) {
        let TAG = "search";
        fLog(TAG, 'reqbody', query);
        MongoClient.connect(DB_URL, (error, client) => {
            const db = client.db('Ranibis');
            const queryObj = parseSearchQuery(query);
            fLog(TAG, 'queryObj.findObj', queryObj);
            const cursor = db.collection('advert').find({ ...queryObj.findObj, state: AdvertState.STATE_ACTIVE }, queryObj.scoreObj);
            handleIdListCurrsor(cursor, queryObj.sortObj, callback, TAG)
        });
    },
    myAdvertIds: function (db, reqbody, userId, callback) {
        let TAG = "myAdvertIds";
        fLog(TAG, 'userId', userId);
        const cursor = db.collection('advert').find({ userId: userId});
        handleIdListCurrsor(cursor, SORT_LAST_MODIFIED_FIRST, callback, TAG)
    },
    myAdvertIdsForAdmin: function (db, reqbody, userId, callback) {
        let TAG = "myAdvertIdsForAdmin";
        fLog(TAG, 'reqbody', reqbody);
        fLog(TAG, 'userId', userId);
        getUserByIdPromise(db, userId).then(user => {
            fLog(TAG, 'user.role', user.role);
            if (user.role === "admin") {
                const cursor = db.collection('advert').find({ state: AdvertState.STATE_TO_APPROVE });
                handleIdListCurrsor(cursor, SORT_OLDEST_FIRST, callback, TAG)
            } else {
                callback({}, StatusCodes.UNAUTHORIZED);
            }
        })
    },
    userAdverts: function (db, reqbody, callback) {
        let TAG = "userAdverts";
        fLog(TAG, 'reqbody', reqbody);
        const cursor = db.collection('advert').find({ ...reqbody, state: AdvertState.STATE_ACTIVE });
        handleIdListCurrsor(cursor, SORT_LATEST_FIRST, callback, TAG)
    },
    gallery: function (db, { lng }, callback) {
        let TAG = "gallery";
        fLog(TAG, 'reqbody', { lng });
        db.collection('gallery')
            .find({})
            .sort({ $natural: -1 })
            .toArray(function (err, result) {
                if (!err)
                    callback(Array.from(result, item => item.advertId));
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
    },
};