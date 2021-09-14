
const e = require("express");
const { EN_TEXT_PACKAGE, baseInsertId, insertTexts } = require("../db/noDbTexts");
const sqlhelper = require("./sqlhelper");
const { StatusCodes } = require("http-status-codes");
const { fLog } = require('../../utils');

const PACKAGES = {
    ROOT: [ /*ROOT*/
        "apps.action.nav.search",
        "apps.action.nav.login",
        "apps.action.nav.account",
        "apps.action.nav.favorites",
        "apps.action.nav.listings",
        "apps.action.nav.insert",
        "apps.action.new.backtosearch",
        "apps.action.new.previousadvert",
        "apps.action.new.nextadvert",
        "apps.category",
        "apps.categories",
        "apps.subcategory",
        "apps.subcategories",
        "apps.inallcategories",
        "apps.filter",
        "apps.action.resetfilters",
        "apps.location",
        "apps.all",
        "apps.radius",
        "apps.state",
        "apps.action.back",
        "apps.action.next",
        "apps.action.close",
        "apps.action.apply",
        "apps.action.cancel",
        "apps.action.search",
        "apps.any",
        "apps.advertcity",
        "apps.homepage",
        "apps.home.favorites.label",
        "apps.favourites.signintosync.message",
        "apps.nolistings",
        "apps.nolistings.description",
        "apps.action.newad",
        "apps.settings",
        "apps.footer.responsibility",
        "apps.footer.copyright",
        "apps.noresults.createnotification",
        "apps.noresults.createnotification.description",
        "apps.notification.enable",
    ],
    HOME: [   /*HOME*/
        "apps.searchkeyword",
        "apps.home.new.inallcategories",
        "apps.home.new.realestate.rent",
        "apps.home.new.realestate.buy",
        "apps.home.new.cars",
        "apps.home.new.jobs",
        "apps.home.gallery.label",
        "apps.home.favorites.label",
        "apps.action.home.more.favorites",
        "apps.home.lastsearch.label",
        "apps.action.home.more.lastsearch",
        "apps.home.lastviewed.label",
        "apps.action.home.more.lastviewed",
        "apps.search",
        "apps.insertion",
        "apps.myanibis",
        "apps.home.new.title",
        "apps.home.new.newoffers",
        "apps.action.search",
        "apps.conditions",
        "apps.tariff",
        "apps.safety",
    ],
    SEARCH: [   /*SEARCH*/
        "apps.category",
        "apps.categories",
        "apps.subcategory",
        "apps.subcategories",
        "apps.location",
        "apps.all",
        "apps.radius",
        "apps.state",
        "apps.from",
        "apps.to",
        "apps.resulttitle",
        "apps.search.term",
        "apps.sorting",
        "apps.sort.pri.asc",
        "apps.sort.pri.desc",
        "apps.sort.dpo.desc",
        "apps.sort.ftw.asc",
        "apps.price",
        "apps.advertcity",
        "apps.allfilter",
        "apps.action.showresultsfromcategories_0",
        "apps.action.showresultsfromcategories_1",
        "apps.action.showresultsfromcategories_n",
    ],
    // DETAIL_BROWSER: [   /*DETAIL_BROWSER*/
    // ],
    DETAIL: [   /*DETAIL*/
        "apps.action.contactseller",
        "apps.registeredsince",
        "apps.description",
        "apps.action.showmorelistings",
        "apps.details",
        "apps.insertion.contact", 
        "apps.share", "apps.listings",
        "apps.seller",
        "apps.morelistings",
        "apps.action.home.more",
        "apps.listing",
        "apps.advertid",
        "apps.action.reportfraud",
        "apps.safety",
        "apps.action.copylink",
        "apps.action.contactemail",
        "apps.action.print",
        "apps.action.favorite",
        "apps.advertedit",
        "apps.action.new.call",
        "apps.action.openmap",
    ],
    LOGIN_REGISTER: [   /*LOGIN_REGISTER*/
        "apps.password",
        "apps.username",
        "apps.email",
        "apps.action.retrievepassword",
        "apps.action.login",
        "apps.message.noaccount",
        "apps.action.createaccount",
        "apps.login",
        "apps.needlogin",
        "apps.message.loginfail",
        "apps.message.loginsuccess",
        "apps.action.backtosearch",
        "apps.action.cancel",
        "apps.action.continue",
        "apps.action.back",
        "apps.new.checkmandatoryfield",
        "apps.action.revealpassword",
        'apps.action.change',
        'apps.action.hidepassword',
    ],
    FAVORITE: [   /*FAVORITE*/
        "apps.favorites",
        "apps.nofavorites",
        "apps.nofavorites.description",
        "apps.deletedfavorite",
    ],
    HISTORY: [   /*HISTORY*/
        "apps.nohistory",
        "apps.history",
        "apps.nohistory.description",
    ],
    INSERT: [   /*INSERT*/
        "apps.action.addimage",
        "apps.title",
        "apps.description",
        "apps.categories",
        "apps.pricetype",
        "apps.action.no",
        "apps.action.yes",
        "apps.insertion.contact.location",
        "apps.contacttype",
        "apps.contacttypeform",
        "apps.contacttypephone",
        "apps.contacttypeboth",
        "apps.contacttype.message",
        "apps.links.conditions.anchor.new",
        "apps.links.conditions.and",
        "apps.links.rules.anchor",
        "apps.action.publish",
        "apps.insertion.category.select",
        "apps.advertcountry",
        "apps.advertzipcode",
        "apps.advertcity",
        "apps.advertstreet",
        "apps.general.inputoptional",
        "apps.action.editpicture",
        "apps.action.editpicture",
        "apps.new.checkmandatoryfield",
        "apps.insertion.step.categoryattribute",
        "apps.insertion.step.photo",
        "apps.insertion.step.titledescription",
        "apps.insertion.step.contact",
        "apps.insertion.step.previewpublish",
        "apps.insertion.title.categoryattribute",
        "apps.insertion.title.photo",
        "apps.insertion.title.titledescription",
        "apps.insertion.title.contact",
        "apps.insertion.title.previewpost",
        "apps.totalphoto",
        "apps.addphotohint",
        "apps.uploading",
        "apps.photo",
        "apps.validationtitle",
    ],
    ACCOUNT: [   /*ACCOUNT*/
        "apps.listings.description",
        "apps.createlistings",
        "apps.createlistings.description",
        "apps.accountsettings",
        "apps.accountsettings.description",
        "apps.createlistings",
        "apps.createlistings.description",
        "apps.accountsettings",
        "apps.accountsettings.description",
        "apps.account.signedinas",
        "apps.account.usersettings",
        "apps.action.changepassword",
        "apps.action.logout",
        "apps.action.backtosearch",
        "apps.action.cancel",
        "apps.footer.responsibility",
        "apps.footer.copyright",
        "apps.email",
        "apps.registeredsince",
        "apps.action.back",
    ],
    MY_ADVERTS: [   /*MY_ADVERTS*/
        "apps.statsviews",
        "apps.statsrequests",
        "apps.onlineto",
        "apps.datedeactivate",
        "apps.datecreate",
        "apps.dateexpired",
        "apps.active",
        "apps.inactive",
        "apps.draft",
        "apps.expired",
        "apps.inpreview",
        "apps.deleted",
        "apps.rejected",
        "apps.promotion",
        "apps.action.upgradead",
        "apps.statisticstatus",
        "apps.statisticreset",
        "apps.action.edit",
        "apps.action.complete",
        "apps.action.activate",
        "apps.action.pause",
        "apps.action.deletelisting",
        "apps.listings.topposition",
        "apps.listings.highlight",
        "apps.listings.websitelink",
        "apps.listings.homepagegallery",
        "apps.listings.turbo",
        "apps.listings.megadeal",
        "apps.action.deeplink.mylistings.ios",
        "apps.action.approve",
        "apps.action.reject",
        "apps.confirmation.promoteadvert",
        "apps.message.promotesuccess",
        "apps.confirmation.deleteadvert",
        "apps.confirmation.activate",
        "apps.confirmation.deactivate",
    ]
};
var db = null;
const cache = { en: {}, de: {}, fr: {}, it: {} };
module.exports = {
    getHandlers: ['textPack'],
    setDatabase: function (_db) {
        let TAG = "setDatabase";
        db = _db;
        fLog(TAG, 'attributesByCatId setDatabase db', db);
    },
    updateDB: function () {
        let TAG = "updateDB";
        let nextId = 999999999;
        let queryMaxId = `SELECT MAX(resourceId) as maxId
                    FROM XBResources`;
        db.get(queryMaxId, (err, row) => {
            if (!err && row) {
                fLog(TAG, 'queryMaxId row', row);
                nextId = row.maxId + 1;

                let newMaxId = baseInsertId + insertTexts.length - 1;
                fLog(TAG, 'textResource baseInsertId', baseInsertId, 'insertTexts.length', insertTexts.length)
                // insertTexts.map((item, index) => fLog(TAG, 'index', index, 'item', item));
                fLog(TAG, 'textResource nextId', nextId, 'newMaxId', newMaxId);
                // nextId = 20014;
                let idKeyValues = [];
                let idTranslateValues = [];
                while (nextId <= newMaxId) {
                    let textIndex = nextId - baseInsertId;
                    let nextTextInfo = insertTexts[textIndex];
                    fLog(TAG, 'textIndex', textIndex, 'nextTextInfo', nextTextInfo)
                    idKeyValues.push(`(${nextId}, '${nextTextInfo[0]}')`);
                    idTranslateValues.push(
                        `('${nextId}.de', '${nextTextInfo[1].replace(/'/g, "''")}', 'de', ${nextId}, 0)`,
                        `('${nextId}.fr', '${nextTextInfo[2].replace(/'/g, "''")}', 'fr', ${nextId}, 0)`,
                        `('${nextId}.it', '${nextTextInfo[3].replace(/'/g, "''")}', 'it', ${nextId}, 0)`,
                    );
                    nextId++;
                }
                if (idKeyValues.length > 0) {
                    let insertQuery1 = `INSERT INTO XBResources
                            VALUES ${idKeyValues.join(',')}`;
                    let insertQuery2 = `INSERT INTO XBTextResources
                                        VALUES ${idTranslateValues.join(',')}`;

                    fLog(TAG, 'XBResources', insertQuery1);
                    fLog(TAG, 'XBTextResources', insertQuery2);
                    db.run(insertQuery1, function (err) {
                        if (err) {
                            fLog(TAG, "insertQuery1 err", err.message);
                        }
                    });
                    db.run(insertQuery2, function (err) {
                        if (err) {
                            fLog(TAG, "insertQuery2 err", err.message);
                        }
                    });
                } else {
                    fLog(TAG, 'textResource updateDB DB already updated!')
                }
            }
        });
    },
    textPack: function ({ id, lng }, callback) {
        let TAG = "textPack";
        fLog(TAG, lng, "id: ", id)
        if (cache[lng][id]) {
            fLog(TAG, 'cached!!!!!!!!');
            callback(cache[lng][id]);
        } else if (lng === 'en') {
            callback(EN_TEXT_PACKAGE && EN_TEXT_PACKAGE[id] || []);
        }
        else {
            let query = `SELECT XBResources.resourceKey AS key, text FROM XBResources, XBTextResources WHERE XBTextResources.language = '${lng}' AND XBResources.resourceId = XBTextResources.resourceId  AND XBResources.resourceKey IN  (${Array.from(PACKAGES[id], item => `'${item}'`)})`;
            fLog(TAG, '/textPack query', query, "id: ", id)
            db.all(query, function (err, rows) {
                if (!err) {
                    cache[lng][id] = rows;
                    callback(rows)
                }
                else
                    callback(err, StatusCodes.INTERNAL_SERVER_ERROR);
            });
        }
    },
}