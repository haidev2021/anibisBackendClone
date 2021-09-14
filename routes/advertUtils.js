const { ObjectId } = require('mongodb'); // or ObjectID 
const { fLog, checkLanguageSupported } = require('./utils');
const { getCategoriesByIds } = require('./xbase/model/category');
// const LIGHT_LIST_PROJECT = { attributes: 0, description: 0, pictures: 0, userId: 0, user: 0 };
const LIGHT_LIST_PROJECT = {
    thumbnail: 1,
    title: 1,
    price: 1,
};
const LIST_PROJECT = {
    language: 1,
    thumbnail: 1,
    "contactAddress.zip": 1,
    "contactAddress.city": 1,
    categoryId: 1,
    posted: 1,
    title: 1,
    briefDescription: 1,
    price: 1,
    hits: 1,
    contacts: 1,
    expiring: 1,
    state: 1,
    categoryName: 1,
};
const SORT_LATEST_FIRST = {
    $natural: -1
};
const SORT_OLDEST_FIRST = {
    $natural: 1
};
const SORT_LAST_MODIFIED_FIRST = {
    modified: -1
};

const AdvertState = Object.freeze({
    STATE_EXPIRED: 1,
    STATE_DEACTAVATED: 2,
    STATE_DELETED: 3,
    STATE_BLOCKED: 4,
    STATE_TO_APPROVE: 5,
    STATE_DRAFT: 6,
    STATE_IMPLIO_CHECK: 7,
    STATE_TO_APPROVE_PICTURE_CHECK: 8,
    STATE_ACTIVE: 10,
    STATE_ACTIVE_PICTURE_CHECK: 12,
})
    ;
module.exports = {
    LIST_PROJECT: LIST_PROJECT,
    LIGHT_LIST_PROJECT: LIGHT_LIST_PROJECT,
    SORT_LATEST_FIRST: SORT_LATEST_FIRST,
    SORT_OLDEST_FIRST: SORT_OLDEST_FIRST,
    SORT_LAST_MODIFIED_FIRST: SORT_LAST_MODIFIED_FIRST,
    getAdvertByIdPromise: function (db, id) {
        let TAG = "getAdvertByIdPromise";
        fLog(TAG, "ObjectId.isValid(id)", ObjectId.isValid(id));
        return ObjectId.isValid(id) ? db.collection('advert').findOne({ _id: ObjectId(id) }) : new Promise((resolve, reject) => resolve({}));
    },
    getAdvertsByIdsPromise: function (db, ids) {
        let TAG = "getAdvertsByIdsPromise";
        let objectIs = Array.from(ids, item => ObjectId(item));
        fLog(TAG, "ids", ids);
        return db.collection('advert').find({ "_id": { "$in": objectIs } });
    },
    extractViewableAdvertIds: function (db, ids, callback, debugInfo) {
        let TAG = "extractViewableAdvertIds";
        const objectIds = Array.from(ids, id => ObjectId(id))
        return db.collection('advert').find({ _id: { $in: objectIds }, state: AdvertState.STATE_ACTIVE }).project({ _id: 1 })
            .toArray(function (err, result) {
                fLog(TAG, `${debugInfo} result.length`, result.length)
                if (!err) {
                    let onlyIds = result && Array.from(result, item => item._id.toHexString()) || [];
                    fLog(TAG, `${debugInfo} onlyIds`, onlyIds)
                    callback(onlyIds);
                } else {
                    callback(err, StatusCodes.NOT_FOUND);//404
                }
            });
    },
    getUserByIdPromise: function (db, id) {
        let TAG = "getUserByIdPromise";
        return db.collection('user').findOne({ _id: ObjectId(id) });
    },

    getLightDetailsByIds: function (db, ids, lng, project, callback, debug) {
        let TAG = "getLightDetailsByIds";
        let objectIs = Array.from(ids, item => ObjectId(item));

        fLog(TAG, debug + ' ids', ids)
        db.collection('advert').find({ "_id": { "$in": objectIs } }).project(project)
            .sort(SORT_LATEST_FIRST)
            .toArray(function (err, result) {
                if (!err) {
                    result.sort(function (a, b) {
                        // fLog(TAG, 'sort a._id', a._id.toHexString(), 'indexOf a._id', ids.indexOf(a._id.toHexString()))
                        let dis = ids.indexOf(a._id.toHexString()) - ids.indexOf(b._id.toHexString());
                        // 
                        fLog(TAG, 'dis', dis);
                        return dis;
                    });

                    fLog(TAG, debug + " result", result)
                    if (project.categoryName) {
                        const catIds = Array.from(result, item => item.categoryId);
                        getCategoriesByIds({ ids: catIds, lng }, catInfos => {
                            const catMap = new Map(Array.from(catInfos, item => [item.id, item.name]));
                            result.map(item => item.categoryName = catMap.get(item.categoryId));
                            callback(result);
                        })
                    } else
                        callback(result);
                } else {
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            });
    },
    AdvertState: AdvertState,
}