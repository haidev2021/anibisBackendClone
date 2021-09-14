
var jwt = require('jsonwebtoken');
const SECRET = "-s-E-c-r-E-t-E-n-O-U-g-h-";
const AUTHORIZED_APIS = ["insert", "updateAdvert", "myAdvertIds", "promote", "delete", "myAdvertIdsForAdmin"];
const XBASE_SUPPORT_LANGUAGES = ['de', 'fr', 'it'];
function jwtSign(payload, callback) {
    jwt.sign(payload, SECRET, callback);
}
function jwtVerify(token, callback) {
    jwt.verify(token, SECRET, callback);
}
function jwtDecode(token) {
    return jwt.decode(token);
}

function getExportObject(models) {
    const postHandlers = [];
    const getHandlers = [];
    const authorizedAPIs = [];
    let _exports = {}
    models.map(model => {
        function assignHandler(handler) {
            _exports[handler] = model[handler];
        }
        if (model.postHandlers) {
            postHandlers.push(...model.postHandlers);
            model.postHandlers.map(assignHandler);
        }
        if (model.getHandlers) {
            getHandlers.push(...model.getHandlers);
            model.getHandlers.map(assignHandler);
        }
        if (model.authorizedAPIs) {
            authorizedAPIs.push(...model.authorizedAPIs);
        }
    });
    _exports.postHandlers = postHandlers;
    _exports.getHandlers = getHandlers;
    _exports.authorizedAPIs = authorizedAPIs;
    return _exports;
}

function processHandler(app, apiType, authorizedAPIs, route, apiName, callback) {
    let TAG = "processHandler";
    fLog(TAG, `app.${apiType} ` + ((route ? ("/" + route) : "") + "/" + apiName));
    app[apiType]((route ? ("/" + route) : "") + "/" + apiName, function (req, res) {
        function sendJsonAsResponse(result, statusCode) {
            if (statusCode)
                res.status(statusCode).end(JSON.stringify(result));
            else
                res.end(JSON.stringify(result));
        }
        const requestData = apiType === "get" ? req.query : req.body;
        if (authorizedAPIs && authorizedAPIs.includes(apiName)) {
            let authorizationHeaderSplitted = req.header('Authorization') ? req.header('Authorization').split(" ") : null;
            let userId = authorizationHeaderSplitted && authorizationHeaderSplitted.length == 2 ?
                jwtDecode(authorizationHeaderSplitted[1])._id : null;
            fLog(TAG, 'jwtDecode userId', userId)
            callback(req.db, requestData, userId, sendJsonAsResponse)
        } else {
            if (route == "xbase")
                callback(requestData, sendJsonAsResponse)
            else
                callback(req.db, requestData, sendJsonAsResponse)
        }
    });
}

function bunbleResponse(entities, app) {
    let TAG = "bunbleResponse";
    entities.map(e => {
        if (e.postHandlers) {
            e.postHandlers.map(apiName => {
                processHandler(app, 'post', e.authorizedAPIs, e.route, apiName, e[apiName]);
            });
        }
        if (e.getHandlers) {
            e.getHandlers.map(apiName => {
                processHandler(app, 'get', e.authorizedAPIs, e.route, apiName, e[apiName]);
            });
        }
    })
}

function checkLanguageSupported(lng) {
    return XBASE_SUPPORT_LANGUAGES.includes(lng) ? lng : 'de';
}

const APIS_TO_DEBUG = [
    // "validateEmail",
    // "signin",
    // "register",
    // "verifyToken",
    // "favoriteAddRemove",
    // "favoriteLocalSync",
    // "getSubCategories",
    // "getCategoriesByIds",
    // "getCategoryPathById",
    // "attributesByCatId",
    // "countries",
    // "textPack",
    // "locationSuggestion",
    "insert",
    // "updateAdvert",
    // "updateAdvertForAdmin",
    // "detail",
    // "promote",
    // "delete",
    // "lastestOffers",
    // "searchResult",
    // "search",
    // "myAdvertIds",
    // "myAdvertIdsForAdmin",
    // "favoriteIds",
    // "userAdverts",
    // "gallery",
    // "searchCount",
    // "parseSearchQuery",
    "processHandler",
    // "getCategoryByIdAsParentIdRecursive",
    // "detailsForApp",
    // "upload",
];

function fLog() {
    if (APIS_TO_DEBUG.includes(arguments[0]))
        console.log("/", ...arguments);
}

module.exports = {
    jwtSign: jwtSign,
    jwtVerify: jwtVerify,
    jwtDecode: jwtDecode,
    getExportObject: getExportObject,
    bunbleResponse: bunbleResponse,
    checkLanguageSupported: checkLanguageSupported,
    fLog: fLog,
};