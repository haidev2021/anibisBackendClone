

const queryString = require('query-string');
const { fLog } = require('../../utils');

const EXCLUDES = { attributes: 0, description: 0, pictures: 0, userId: 0 };
const SORT_TEXT_MONGO = { score: { $meta: "textScore" } };
const LATEST_OFFER_LIMIT = 8;

const LANGUAGE = "language";
const WHITELABLE_ID = "whitelabelId";
const TEXT_RESOURCE_SECTION = "sectionOrId";
const CATEGORY_SUGGESTION_KEYWORD = "keyword";
const MODULE = "module";
const GEO_COUNTRY_CODE = "countryCode";
const GEO_ZIP = "zip";
const GEO_NAME = "name";
const CATEGORY_ID = "cid";
const ADVERT_LANGUAGE = "lng";
const WITH_IMAGES_ONLY = "wio";
const SEARCH_TERM = "fts";
const SEARCH_LOCATION = "loc";
const SEARCH_DISTANCE = "sdc";
const RESULT_PAGE_INDEX = "pi";
const RESULT_PAGE_SIZE = "ps";
const SORT_FIELD = "sf";
const SORT_ORDER = "so";
const ATTRIBUTE_ID_LIST = "aidl";
const ATTRIBUTE_MULTIID_LIST = "amid";
const ATTRIBUTE_TEXT_LIST = "atxl";
const ATTRIBUTE_RANGE_LIST_NUMBER = "aral";
const ATTRIBUTE_RANGE_LIST_DATE = "ardl";
const MEMBER_ID = "mid";
const USERNAME = "sun";
const SEARCH_CANTON = "sct";
const USE_ADVERT_LANGUAGE_FILTER = "ualf";
const ADVERT_TYPE = "aty";
const ADVERT_ID = "advertId";
const DEVICE_TOKEN = "DeviceToken";
const USER_SETTING_API_MEMBER_ID = "memberId";
const AUTOCOMPLETE_SEARCH_TERM = "searchTerm";
const AUTOCOMPLETE_CATEGORY_ID = "categoryId";
const AUTOCOMPLETE_NUMBER_OF_RESULTS = "numberOfResults";

function parseMongoType(fieldName, stringValue) {
    if (fieldName === "inputNumber")
        return Number.parseFloat(stringValue)
    else if (fieldName === "inputDate")
        return Date.parse(stringValue)
    else if (fieldName === "attributeEntryId")
        return Number.parseInt(stringValue)
    else
        return stringValue;
}
function getAttributeElemMatchObj(toSplit, fieldName) {
    let TAG = "getAttributeElemMatchObj";
    const [attributeId, input1, input2] = toSplit.split("_");
    const matches = { attributeId: Number.parseInt(attributeId) };
    matches[fieldName] = input2 === undefined ? parseMongoType(fieldName, input1) : (input2 === "" ? { $gte: parseMongoType(fieldName, input1) } :
        { $gte: parseMongoType(fieldName, input1), $lte: parseMongoType(fieldName, input2) });
    fLog(TAG, 'getAttributeElemMatchObj matches', matches)
    return { $elemMatch: matches };
}

function toArray(value) {
    return Array.isArray(value) ? value : (value || value === 0 ? [value] : []);
}

module.exports = {
    /*
        Compose mongo finding object like following:
        {attributes: {$all: [{$elemMatch: {attributeId: 223, inputDate: "2020-10-21"}}, {$elemMatch: {attributeId: 226, attributeEntryId: "15334"}}]}};
    */
    parseSearchQuery: function (query) {
        // query = "atxl=3_%25xxx%25,33_%25yyy%25&cid=113"
        let TAG = "parseSearchQuery";
        fLog(TAG, 'query', query)

        const findObj = {};
        const parsed = queryString.parse(query, { arrayFormat: 'comma' });

        const categoryId = parsed[CATEGORY_ID];
        if (categoryId && categoryId > 0)
            findObj.categoryPath = Number.parseInt(categoryId);

        const text = parsed[SEARCH_TERM];
        if (text)
            findObj.$text = { $search: `\"${text}\"` };


        const zip = parsed[SEARCH_LOCATION];
        if (zip) {
            findObj["contactAddress.zip"] = isNaN(zip) ? zip : Number.parseInt(zip);
        }

        fLog(TAG, 'parsed', parsed)
        fLog(TAG, 'parsed[ATTRIBUTE_TEXT_LIST]', parsed[ATTRIBUTE_TEXT_LIST])
        fLog(TAG, 'parsed[ATTRIBUTE_RANGE_LIST_NUMBER]', parsed[ATTRIBUTE_RANGE_LIST_NUMBER])
        fLog(TAG, 'parsed[ATTRIBUTE_RANGE_LIST_DATE]', parsed[ATTRIBUTE_RANGE_LIST_DATE])
        fLog(TAG, 'parsed[ATTRIBUTE_ID_LIST]', parsed[ATTRIBUTE_ID_LIST])

        const attributeAll = {
            $all: [
                ...Array.from(toArray(parsed[ATTRIBUTE_TEXT_LIST]), item => getAttributeElemMatchObj(item, "inputText")),
                ...Array.from(toArray(parsed[ATTRIBUTE_RANGE_LIST_NUMBER]), item => getAttributeElemMatchObj(item, "inputNumber")),
                ...Array.from(toArray(parsed[ATTRIBUTE_RANGE_LIST_DATE]), item => getAttributeElemMatchObj(item, "inputDate")),
                ...Array.from(toArray(parsed[ATTRIBUTE_ID_LIST]), item => getAttributeElemMatchObj(item, "attributeEntryId")),
            ]
        }
        attributeAll.$all.map(item => {
            fLog(TAG, '/search parseSearchQuery attributeAll.$all item', item)
        })
        if (attributeAll.$all.length > 0)
            findObj.attributes = attributeAll;



        fLog(TAG, '/search parseSearchQuery findObj', findObj);

        const sortField = parsed[SORT_FIELD];
        const sortOrder = parsed[SORT_ORDER];

        const scoreObj = sortField === "ftw" ? SORT_TEXT_MONGO : null;
        fLog(TAG, '/search parseSearchQuery scoreObj', scoreObj);

        let sortObj = {};
        if (text && sortField === "ftw")
            sortObj = SORT_TEXT_MONGO;
        else
            sortObj[sortField === "pri" ? "price" : "posted"] = (sortOrder === "a" ? 1 : -1);

        return { findObj, scoreObj, sortObj };
    }
}