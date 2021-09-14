const { fLog, checkLanguageSupported } = require("../../utils");
const sqlhelper = require("./sqlhelper");
var db = null;
const cache = { de: null, fr: null, it: null };
module.exports = {
    getHandlers: ['countries'],
    setDatabase: function (_db) {
        let TAG = "setDatabase";
        db = _db;
        fLog(TAG, 'db', db);
    },
    countries: function ({ lng }, callback) {
        let TAG = "countries";
        lng = checkLanguageSupported(lng);
        if (cache[lng]) {
            callback({ countries: cache[lng] });
        } else {
            let query = sqlhelper.queries.getCountries(lng);
            fLog(TAG, 'query', query)
            db.all(query, function (err, rows) {
                if (!err) {
                    cache[lng] = rows;
                    callback({ countries: rows });
                } else {
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            });
        }
    },
}