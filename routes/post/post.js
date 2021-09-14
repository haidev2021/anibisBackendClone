var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const { StatusCodes } = require('http-status-codes');
var url = 'mongodb://localhost:27017/Blog';
const { ObjectId } = require('mongodb'); // or ObjectID 
const { fLog } = require('../utils');
module.exports = {
    addPost: function (username, reqbody, callback) {
        let TAG = "addPost";
        fLog(TAG, '/addpost reqbody', reqbody);
        // var blogPhotosResized = reqbody.blogPhotosResized;
        // var blogPhotosThumbnail = reqbody.blogPhotosThumbnail;
        // var title = reqbody.title;
        // var content = reqbody.content;
        fLog(TAG, `/addpost blogPhotosThumbnail ${blogPhotosThumbnail} blogPhotosResized ${blogPhotosResized} title ${title} content ${content}`);
        MongoClient.connect(url, (error, client) => {
            const db = client.db('Blog');
            db.collection('post').insertOne({
                "username": username,
                ...reqbody,
            }, function (err, result) {
                fLog(TAG, "Saved the blog post details.");
                callback(err == null);
                if (!err)
                    callback({}, StatusCodes.CREATED);
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        });
    },
    fetchPosts: function (username, callback) {
        let TAG = "fetchPosts";
        MongoClient.connect(url, (error, client) => {
            const db = client.db('Blog');
            db.collection('post').find({ username: username }).toArray(function (err, result) {
                if (!err)
                    callback(result);
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        });
    },
    getPostWithId: function (id, callback) {
        let TAG = "getPostWithId";
        MongoClient.connect(url, (error, client) => {
            const db = client.db('Blog');
            fLog(TAG, "getPostWithId@post id ", id);
            db.collection('post').findOne({ _id: ObjectId(id) }, function (err, result) {
                fLog(TAG, "getPostWithId@post result ", result);
                if (!err)
                    callback(result);
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        });
    },
    update: function (reqbody, callback) {
        let TAG = "update";
        var id = reqbody.id;
        // var blogPhotosResized = reqbody.blogPhotosResized;
        // var blogPhotosThumbnail = reqbody.blogPhotosThumbnail;
        // var title = reqbody.title;
        // var content = reqbody.content;
        delete reqbody.id;
        fLog(TAG, "postjs update reqbody = ", reqbody);
        fLog(TAG, `/addpost blogPhotosThumbnail ${blogPhotosThumbnail} blogPhotosResized ${blogPhotosResized} title ${title} content ${content}`);
        MongoClient.connect(url, (error, client) => {
            const db = client.db('Blog');
            db.collection('post').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        ...reqbody
                    }
                }, function (err, result) {
                    if (!err)
                        callback({});
                    else
                        callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                });
        });
    },
    delete: function (id, callback) {
        let TAG = "searchCount";
        MongoClient.connect(url, (error, client) => {
            const db = client.db('Blog');
            fLog(TAG, "getPostWithId@post id ", id);
            db.collection('post').deleteOne({ _id: ObjectId(id) }, function (err, result) {
                assert.equal(err, null);
                fLog(TAG, "delete@post result ", result);
                if (!err)
                    callback({});
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        });
    }
}