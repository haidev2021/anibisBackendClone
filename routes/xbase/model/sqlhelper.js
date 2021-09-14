const { fLog, checkLanguageSupported } = require('../../utils');
const PRICE_ATTRIBUTE = 1;
const RANDOM_ATTRIBUTE_WITH_PRICE = 2;

module.exports = {
    makeSQLWhereList: function (rows, propertyName) {
        let TAG = "makeSQLWhereList";
        let whereList = "";
        let whereListTrackMap = new Map;
        rows.map(row => {
            whereList += " " + row[propertyName];
            whereListTrackMap.set(row[propertyName], row);
        });
        whereList = whereList.trim().replace(/ /g, ',');
        fLog(TAG, 'whereList', whereList)
        return [whereListTrackMap, whereList];
    },
    queries: {
        getAttIdsByCat: function (id, isSearch) {
            const refinedCatId = (id || !isSearch) ? id : RANDOM_ATTRIBUTE_WITH_PRICE;
            const attributeIdClause = (id || !isSearch) ? "" : ` AND attributeId = ${PRICE_ATTRIBUTE}`;
            const isSeachableClause = isSearch ? ` AND isSearchable = 1` : ``;
            return (
                `SELECT attributeId AS id, isInSummary, isMainSearch, isMandatory, isSearchable, sortOrder
                FROM XBCategoryAttributes
                WHERE categoryId  = ${refinedCatId} ${attributeIdClause} ${isSeachableClause}
                ORDER BY sortOrder`
            );
        },
        getAttDetail: function (lng, attWhereList) {
            return (
                `SELECT id AS attributeId, parentId, type, name${lng} AS name, defaultSelectItemId, unit${lng} AS unit, numericRangeId AS numericRange 
                FROM XBAttributes 
                WHERE id IN (${attWhereList})`
            );
        },
        getNumericRange: function (numericRangeWhereList) {
            return (
                `SELECT id as numericRangeId, stringFormat, stepValue, minValue, maxValue, isDescending, isInteger, isDynamic 
                FROM XBNumericRanges 
                WHERE id IN (${numericRangeWhereList})`
            );
        },
        getAttEntries: function (lng, attWhereList) {
            return (
                `SELECT id, parentId, attributeId, name${lng} AS name 
                FROM XBAttributeEntries 
                WHERE attributeId IN (${attWhereList})
                ORDER BY name${lng}`
            );
        },
        getCategory: function (id, lng) {
            return (
                `SELECT id, parentId, name${lng} AS name 
                FROM XBCategories 
                WHERE id` + ` = ${id}`
            );
        },
        getSubCategories: function (id, lng) {
            const idClause = id ? `= ${id}` : `is NULL`;
            return (
                `SELECT id, name${lng} AS name 
                FROM XBCategories 
                WHERE parentId ${idClause} 
                ORDER BY name`
            );
        },
        getCategoriesByIds: function (ids, lng) {
            return (
                `SELECT id, name${lng} AS name 
                FROM XBCategories 
                WHERE id IN (${ids}) 
                ORDER BY id`
            );
        },
        getCountries: function (lng) {
            return (
                `SELECT shortCode, name${lng} AS name
                FROM XBCountries`
            );
        },
    }
}