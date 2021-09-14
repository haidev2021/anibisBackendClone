var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const { StatusCodes } = require('http-status-codes');
var DB_URL = 'mongodb://localhost:27017/';
const { ObjectId } = require('mongodb'); // or ObjectID 
const { getAdvertByIdPromise, getAdvertsByIdsPromise, getUserByIdPromise, AdvertState } = require('../../advertUtils');
const { getCategoriesByIds } = require('../../xbase/model/category');
const { fLog } = require('../../utils');
const mongoHelper = require("../helper/mongoHelper");
const NEED_APPROVAL = true;
function refineInsertData(insertData) {
    insertData.attributes.map(item => {
        if (item.inputDate)
            item.inputDate = new Date(item.inputDate);
    })
}
function getState(isUpdate, oldState) {
    console.log('isUpdate', ` (oldState)=${oldState} `);
    console.log('isUpdate', `(oldState)=${oldState} | (oldState)=${oldState} `);
    return isUpdate ?
        ((oldState === AdvertState.STATE_ACTIVE || oldState === AdvertState.STATE_BLOCKED) &&
            NEED_APPROVAL ? AdvertState.STATE_TO_APPROVE : oldState) :
        (NEED_APPROVAL ? AdvertState.STATE_TO_APPROVE : AdvertState.STATE_ACTIVE);
}

function getBriefDescription(description) {
    let result = ""
    console.log('getBriefDescription description', description)
    result = description.substring(0, 200).replace(/\n/g, " ");
    if (result.length < description.length)
        result += " ...";
    return result;
}

module.exports = {
    postHandlers: ['insert', 'updateAdvert', 'updateAdvertForAdmin', 'detail', 'detailsForApp', 'promote', 'delete'],
    authorizedAPIs: ['insert', 'updateAdvert', 'updateAdvertForAdmin', 'promote', 'delete'],
    normalFunctions: ['notifyCreateIndexes'],
    notifyCreateIndexes: function () {
        let TAG = "notifyCreateIndexes";
        fLog(TAG, 'notifyCreateIndexes');
        MongoClient.connect(DB_URL, (error, client) => {
            const db = client.db('Ranibis');
            const coll = db.collection('advert');
            (coll.indexes()).then(function (result) {
                fLog(TAG, 'listIndexes find', result.find(index => index.name === 'title_text_description_text'))
                if (!result.find(index => index.name === 'title_text_description_text')) {
                    coll.createIndex({
                        title: "text",
                        description: "text"
                    }, function (error, result) {
                        fLog(TAG, 'notifyCreateIndexes error', error)
                        fLog(TAG, 'notifyCreateIndexes result', result)
                    })
                }
            })
        });
    },
    insert: function (db, reqbody, userId, callback) {
        let TAG = "insert";
        fLog(TAG, '/insert reqbody', reqbody);
        refineInsertData(reqbody);
        fLog(TAG, '/insert userId', userId);
        db.collection('advert').insertOne({
            userId: userId,
            ...reqbody,
            briefDescription: getBriefDescription(reqbody.description),
            modified: new Date(),/*"2018-05-21T00:30:26"*/
            posted: new Date(),
            expiring: new Date(Date.now() + (6.048e+8 * 2)),
            hits: 0,
            contacts: 0,
            state: getState(false),//NEED_APPROVAL ? AdvertState.STATE_TO_APPROVE : AdvertState.STATE_ACTIVE,
        }, function (err, result) {

            fLog(TAG, "Saved the blog post details.", result.ops);
            if (!err && result.ops[0])
                db.collection('user').find({ "_id": result.ops[0].userId }).project({ password: 0 }).toArray(function (err, user) {
                    fLog(TAG, 'user', user);
                    if (user && !err) {
                        result.ops[0].user = user;
                        callback({ advert: result.ops[0] }, StatusCodes.CREATED);
                    } else
                        callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                });
            else
                callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
        });
    },
    updateAdvert: function (db, reqbody, userId, callback) {
        let TAG = "updateAdvert";
        console.log(reqbody)
        getAdvertByIdPromise(db, reqbody.id).then(detail => {
            if (detail.userId === userId) {
                fLog(TAG, 'detail.userId === userId', detail.userId === userId)

                db.collection('advert').findOneAndUpdate(
                    { _id: ObjectId(reqbody.id) },
                    {
                        $set: {
                            ...reqbody.set,
                            briefDescription: getBriefDescription(reqbody.set.description || detail.description),
                            modified: new Date(),
                            state: getState(true, reqbody.set.state), 
                        }
                    },
                    {
                        returnOriginal: false,
                    },
                    function (err, result) {
                        fLog(TAG, "result ", result);
                        if (result.value && !err)



                            db.collection('user').find({ "_id": result.value.userId }).project({ password: 0 }).toArray(function (err, user) {
                                fLog(TAG, 'user', user);
                                if (user && !err) {
                                    result.value.user = user;
                                    callback({ advert: result.value });
                                } else
                                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                            });
                        else
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);

                    });
            } else {
                callback(null, StatusCodes.UNAUTHORIZED);
            }
        })
    },
    updateAdvertForAdmin: function (db, reqbody, userId, callback) {
        let TAG = "updateAdvertForAdmin";
        fLog(TAG, 'reqbody', reqbody);
        getUserByIdPromise(db, userId).then(user => {
            fLog(TAG, 'user.role', user.role);
            if (user.role === "admin") {

                db.collection('advert').findOneAndUpdate(
                    { _id: ObjectId(reqbody.id) },
                    {
                        $set: {
                            ...reqbody.set,
                            // modified: new Date(),
                        }
                    },
                    {
                        returnOriginal: false,
                    },
                    function (err, result) {
                        fLog(TAG, "result ", result);
                        if (result && !err)
                            callback({ advert: result.value });
                        else
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                    });
            } else {
                callback(null, StatusCodes.UNAUTHORIZED);
            }
        })
    },
    detail: function (db, reqbody, callback) {
        let TAG = "detail";
        fLog(TAG, 'reqbody', reqbody);
        getAdvertByIdPromise(db, reqbody.id).then(detail => {
            fLog(TAG, "/detail detail", detail);
            db.collection('user').findOne({ _id: ObjectId(detail.userId) }, { projection: { password: 0 } }, function (err, user) {
                if (user && !err) {
                    detail.user = user;
                    getCategoriesByIds({ ids: detail.categoryPath, lng: reqbody.lng }, catInfos => {
                        const catMap = new Map(Array.from(catInfos, item => [item.id, item.name]));
                        detail.categoryNamePath = Array.from(detail.categoryPath, item => catMap.get(item));
                        fLog(TAG, 'detail', detail)

                        callback(detail);

                        db.collection('advert').updateOne(
                            { _id: detail._id },
                            {
                                $set: {
                                    hits: detail.hits + 1
                                }
                            });
                    })
                } else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        }).catch(error => {
            callback(null);
        })
    },
    detailsForApp: function (db, { ids }, callback) {
        let TAG = "detailsForApp";
        fLog(TAG, 'ids', ids);
        getAdvertsByIdsPromise(db, ids).toArray(function (err, details) {
            // fLog(TAG, "/detail details", details);
            details.sort(function (a, b) {
                let dis = ids.indexOf(a._id.toHexString()) - ids.indexOf(b._id.toHexString());
                fLog(TAG, 'dis', dis);
                return dis;
            });
            let [userMap, userIdInList] = mongoHelper.makeMongoInList(details, "userId");
            let userObjectIds = Array.from(userIdInList, item => ObjectId(item));
            // fLog(TAG, 'userMap', userMap);
            fLog(TAG, 'userIdInList', userIdInList);
            db.collection('user').find({ "_id": { "$in": userObjectIds } }).project({ password: 0 }).toArray(function (err, users) {
                fLog(TAG, 'users', users);
                if (users && !err) {
                    users.map(user => {
                        userMap.get(user._id.toHexString()).map(detail => {
                            detail.user = user;
                        })
                    })
                    callback(details);
                } else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        })
    },
    promote: function (db, reqbody, userId, callback) {
        let TAG = "promote";
        fLog(TAG, 'reqbody', reqbody);
        getAdvertByIdPromise(db, reqbody.id).then(detail => {
            if (detail.userId === userId) {
                fLog(TAG, 'detail.userId === userId', detail.userId === userId)
                db.collection('gallery').insertOne(
                    { advertId: reqbody.id }, function (err, result) {
                        assert.equal(err, null);
                        fLog(TAG, "/promote result ", result);
                        if (!err)
                            callback({ galleryId: result });
                        else
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                    });
            } else {
                callback(null, StatusCodes.UNAUTHORIZED);
            }
        })
    },
    delete: function (db, reqbody, userId, callback) {
        let TAG = "delete";
        fLog(TAG, 'reqbody', reqbody);
        getAdvertByIdPromise(db, reqbody.id).then(detail => {
            if (detail.userId === userId) {
                fLog(TAG, 'detail.userId === userId', detail.userId === userId);
                (new Promise((resolve, error) => {
                    db.collection('gallery').deleteOne({ advertId: reqbody.id }, function (err, result) {
                        if (!err)
                            resolve(result);
                        else
                            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                    })
                })).then(result => {
                    db.collection('advert').deleteOne(
                        { _id: ObjectId(reqbody.id) }, function (err, result) {
                            fLog(TAG, "result ", result);
                            if (!err)
                                callback({ advertId: result });
                            else
                                callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                        });
                }).catch(err => {
                    fLog(TAG, "gallery catch err", err);
                    callback(err);
                })
            } else {
                callback(null, StatusCodes.UNAUTHORIZED);
            }
        }).catch(err => {
            fLog(TAG, "/delete getAdvertByIdPromise catch err", err);
            callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
        });
    },
};