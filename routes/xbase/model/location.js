var trie = require('trie-prefix-tree');
const locationsData = require('../db/locationData');
const { fLog, checkLanguageSupported } = require('../../utils');
var treeData = { ch: trie([]), vn: trie([]) };
var countries = Object.keys(treeData);
const MAX_RESULTS = 8;
Object.keys(treeData).map(country => {
    locationsData.locations[country].map(item => {
        treeData[country].addWord(`${item.zip} ${item.name}`);
        treeData[country].addWord(`${item.name} ${item.zip}`);
    })
})
module.exports = {
    getHandlers: ['locationSuggestion'],
    locationSuggestion: function ({ language, prefix, countryCode }, callback) {
        let TAG = "locationSuggestion";
        fLog(TAG, 'locationSuggestionlanguage', language, 'prefix', prefix, 'countryCode', countryCode)
        let result = [];
        if (countries.includes(countryCode)) {
            result = treeData[countryCode].getPrefix(prefix);
        } else if (language) {
            let upperResult = treeData[language === "en" ? "vn" : "ch"].getPrefix(prefix);
            let lowerResult = treeData[language === "en" ? "ch" : "vn"].getPrefix(prefix);
            result = [...upperResult, ...lowerResult];
        }
        fLog(TAG, 'locationSuggestionresult', result.slice(0, 8))
        callback(result.slice(0, MAX_RESULTS));
    }
}