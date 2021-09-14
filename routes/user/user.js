var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var moment = require('moment');
const { getAdvertByIdPromise, extractViewableAdvertIds, AdvertState } = require('../advertUtils');
var DB_URL = 'mongodb://localhost:27017';
var { fLog, jwtSign } = require('../utils');
const { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } = require('http-status-codes');

function register(db, emailPasswordJason, callback) {
	let TAG = "register";
	fLog(TAG, 'emailPasswordJason', emailPasswordJason)
	let memberSince = moment(new Date()).format('MM/DD/YYYY');
	db.collection('user').insertOne({
		...emailPasswordJason,
		"memberSince": memberSince,
	}, function (err, result) {
		if (!err)
			callback({ emailStatus: { email: emailPasswordJason.email, memberSince: result ? memberSince : null } });
		else
			callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
	});
}
function validateEmail(db, emailJson, callback) {
	let TAG = "validateEmail";
	db.collection('user').findOne(emailJson, function (err, result) {
		fLog(TAG, 'result', result)
		if (!err)
			callback({ emailStatus: { email: emailJson.email, memberSince: result ? result.memberSince : null } });
		else
			callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
	});
}
function signin(db, siginInfo, callback) {
	let TAG = "signin";
	fLog(TAG, 'siginInfo', siginInfo)
	db.collection('user').findOne({ email: siginInfo.email, password: siginInfo.password }, function (err, result) {
		if (!err && result) {
			jwtSign({ /*email: result.email, memberSince: result.memberSince, */_id: result._id }, function (err, encoded) {
				fLog(TAG, "result ", result, encoded);
				if (!err && encoded) {
					callback({ loginInfo: { email: result.email, memberSince: result.memberSince, token: encoded, _id: result._id, role: result.role } })
				} else {
					callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
				}
			});
		} else {
			if (!err && !result)
				callback(null, StatusCodes.NOT_FOUND);
			else
				callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	});
}
function verifyToken(siginInfo, callback) {
	let TAG = "searchCount";
	fLog(TAG, 'siginInfo', siginInfo)
	jwtVerify(siginInfo.token, function (err, decoded) {
		callback({ loginInfo: !err && decoded ? { email: decoded.email, memberSince: decoded.memberSince, token: siginInfo.token } : null });
	});
}
function gooogleSignIn(db, name, email, callback) {
	let TAG = "gooogleSignIn";
	db.collection('user').updateOne({
		"email": email
	}, {
		$set: {
			"name": name,
		}
	}, {
		upsert: true
	}, function (err, result) {
		assert.equal(err, null);
		fLog(TAG, "Saved the user google sign up details.");
	});
}

function favoriteAddRemove(db, reqbody, userId, callback) {
	let TAG = "favoriteAddRemove";
	fLog(TAG, 'reqbody', reqbody);
	fLog(TAG, 'userId', userId);
	if (reqbody.action == 0) {
		db.collection('favorite').find(
			{ userId: userId }, function (err, result) {
				fLog(TAG, "result ", result);
				if (!err)
					callback(Array.from(result, item => item.advertId));//code 200
				else
					callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
			});
	} else if (reqbody.action == 1) {
		getAdvertByIdPromise(db, reqbody.id)
			.then(detail => {
				if (detail && detail.state === AdvertState.STATE_ACTIVE) {
					db.collection('favorite').insertOne(
						{ advertId: reqbody.id, userId: userId }, function (err, result) {
							fLog(TAG, "add result ", result);
							if (!err)
								callback({}, StatusCodes.CREATED);//201
							else
								callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
						});
				} else {
					callback({}, StatusCodes.NOT_FOUND);//404
				}
			})
			.catch(err => {
				callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
			})
	} else {
		db.collection('favorite').findOneAndDelete(
			{ advertId: reqbody.id, userId: userId }, function (err, result) {
				fLog(TAG, "/favoriteAddRemove remove result ", result);
				if (!err)
					callback({}, StatusCodes.RESET_CONTENT);//205
				else
					callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
			});
	}
}

function favoriteLocalSync(db, reqbody, userId, callback) {
	let TAG = "favoriteLocalSync";
	fLog(TAG, 'reqbody', reqbody);
	fLog(TAG, 'userId', userId);
	extractViewableAdvertIds(db, reqbody.favoriteIds, properIds => {
		fLog(TAG, 'properIds', properIds);
		if (properIds.length > 0) {
			db.collection('favorite').insertMany(
				Array.from(properIds, advertId => ({ advertId: advertId, userId: userId })), function (err, result) {
					fLog(TAG, "insertMany result ", result);
					if (!err)
						callback({}, StatusCodes.CREATED);//201
					else
						callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
				});
		} else {
			callback({}, StatusCodes.NOT_FOUND);//404
		}
	})
}
module.exports = {
	route: "user",
	postHandlers: ['validateEmail', 'signin', 'register', 'verifyToken', 'favoriteAddRemove', 'favoriteLocalSync'],
	authorizedAPIs: ['favoriteAddRemove', 'favoriteLocalSync'],
	// gooogleSignIn: gooogleSignIn,
	validateEmail: validateEmail,
	signin: signin,
	verifyToken: verifyToken,
	register: register,
	favoriteAddRemove: favoriteAddRemove,
	favoriteLocalSync: favoriteLocalSync,
}


