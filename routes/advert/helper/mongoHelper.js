
const { fLog } = require('../../utils');
module.exports = {
    makeMongoInList: function (rows, propertyName) {
        let TAG = "makeSQLWhereList";
        let inList = [];
        let inListTrackMap = new Map;
        rows.map(row => {
            if(!inList.includes(row[propertyName]))
                inList.push(row[propertyName]);
            if (inListTrackMap.has(row[propertyName])) {
                inListTrackMap.get(row[propertyName]).push(row);
            } else {
                inListTrackMap.set(row[propertyName], [row]);
            }
        });
        fLog(TAG, 'inList', inList)
        return [inListTrackMap, inList];
    },
}