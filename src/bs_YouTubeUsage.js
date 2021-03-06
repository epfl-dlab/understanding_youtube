import * as Debugging from "../WebScience/Utilities/Debugging.js"
import * as Storage from "../WebScience/Utilities/Storage.js"
import * as Messaging from "../WebScience/Utilities/Messaging.js"

const debugLog = Debugging.getDebuggingLog("YouTubeUsage");


/**
 * A KeyValueStorage object for data associated with the study.
 * @type {Object}
 * @private
 */
let storage = null;

/**
 * @name runStudy starts collecting navigational data on YouTube
 * It injects content scripts to track user's exposure
 */
export async function runStudy() {
    storage = await (new Storage.KeyValueStorage("YouTubeUsage")).initialize();
    // Add the content script for checking links on pages
    debugLog("YouTubeUsage.js");

    /** Click data **/

    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [
            {file: "/dist/cs_clicksYouTube.js"},
        ],
        runAt: "document_idle"
    });
    Messaging.registerListener("YoutubeLinkClick",
        async (message, sender, sendResponse) => {
            debugLog("YoutubeLinkClick: " + JSON.stringify(message));
            if (!("tab" in sender)) {
                debugLog("Warning: unexpected social media account exposure update");
            }
            storage.set(Date.now().toString() + "_lc", JSON.stringify(message));
        }, {
            type: "string",
            url_src: "string",
            loadTime: "number",
            url_dst: "string",
            node: "string",
            logged_off: "boolean"
        });

    /** Front page **/

    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [{file: "/dist/cs_frontpageYouTube.js"}],
        runAt: "document_start"
    });
    const rxLookfor = /^https?:\/\/(www\.)?youtube\.com\/?$/;
    browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            try {
                if (rxLookfor.test(changeInfo.url)) {
                    browser.tabs.sendMessage(tabId, 'url-update');
                }
            } catch (e) {
                console.log("err")
            }
        }
    );

    Messaging.registerListener("frontpageYouTube",
        async (message, sender, sendResponse) => {
            debugLog("frontpageYouTube: " + JSON.stringify(message));
            storage.set(Date.now().toString() + "_fp", JSON.stringify(message));
        }, {
            type: "string",
            loadTime: "number",
            recs: "string"
        });

    /** Video metadata data **/

    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [
            {file: "/dist/cs_videoMetadata.js"},
        ],
        runAt: "document_idle"
    });

    Messaging.registerListener("videoMetaData",
        async (message, sender, sendResponse) => {
            debugLog("VideoMetaData: " + JSON.stringify(message));
            if (!("tab" in sender)) {
                debugLog("Warning: unexpected social media account exposure update");
            }
            console.log(message);
            storage.set(Date.now().toString() + "_vd", JSON.stringify(message));
        }, {
            type: "string",
            loadTime: "number",
            title: "string",
            likes: "number",
            dislikes: "number",
            description: "string",
            channel_link: "string",
            channel_name: "string",
            date: "string",
            views: "number",
            genre: "string",
            url_src: "string",
            metadata_dict_raw: "string"
        });

    /** Video recs **/


    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [
            {file: "/dist/cs_recsYouTube.js"},
        ],
        runAt: "document_idle"
    });

    Messaging.registerListener("recsYoutube",
        async (message, sender, sendResponse) => {
            debugLog("recsYoutube: " + JSON.stringify(message));
            if (!("tab" in sender)) {
                debugLog("Warning: unexpected social media account exposure update");
            }
            storage.set(Date.now().toString() + "_rc", JSON.stringify(message));
        }, {
            type: "string",
            loadTime: "number",
            url_src: "string",
            recs: "string",
            origin: "string"
        });

    /** Video comments **/

    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [
            {file: "/dist/cs_comsYouTube.js"},
        ],
        runAt: "document_idle"
    });

    Messaging.registerListener("comment",
        async (message, sender, sendResponse) => {
            debugLog("comment: " + JSON.stringify(message));
            if (!("tab" in sender)) {
                debugLog("Warning: unexpected social media account exposure update");
            }
            storage.set(Date.now().toString() + "_cm", JSON.stringify(message));
        }, {
            type: "string",
            loadTime: "number",
            comment: "string",
            url_src: "url_src"
        });

    /** Video search **/

    await browser.contentScripts.register({
        matches: ["*://*.youtube.com/*"],
        js: [
            {file: "/dist/cs_searchYouTube.js"},
        ],
        runAt: "document_idle"
    });

    Messaging.registerListener("search",
        async (message, sender, sendResponse) => {
            debugLog("search: " + JSON.stringify(message));
            storage.set(Date.now().toString() + "_sr", JSON.stringify(message));
        }, {
            type: "string",
            loadTime: "number",
            search: "string",
            url_src: "string",
            origin: "string",
        });

}

/**
 * Retrieve the study data as an object. Clears sessions that are already complete.
 * @returns {(Object|null)} - The study data, or `null` if no data
 * could be retrieved.
 */
export async function getStudyDataAsObjectAndClear() {
    const output = {};
    const arr = [];

    if (storage != null) {

        await storage.iterate((value, key, iterationNumber) => {
            arr.push(key);
            const tmp = JSON.stringify(value);
            output[key] = tmp;

        });

        for (const v in arr) {
            // console.log("removed", arr[v]);
            storage.storageInstance.removeItem(arr[v]).then().catch(function (err) {
                // This code runs if there were any errors
                console.log(err);
            });
        }
        return JSON.stringify(output);
    }
    return null;

}




