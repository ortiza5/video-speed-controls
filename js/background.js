// // only enable the extension on pages with html5 videos
// chrome.runtime.onInstalled.addListener(function () {
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//         chrome.declarativeContent.onPageChanged.addRules([{
//             conditions: [
//                 new chrome.declarativeContent.PageStateMatcher({
//                     pageUrl: {
//                         schemes: ['http', 'https']
//                     }
//                 })
//             ],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);

//     });
// });


// only enable the extension on pages with html5 videos
// chrome.runtime.onInstalled.addListener(function () {
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//         chrome.declarativeContent.onPageChanged.addRules([{
//             conditions: [
//                 new chrome.declarativeContent.PageStateMatcher({
//                     css: ["video"]
//                 })
//             ],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);

//     });
// });

// // get keyboard shortcut
// chrome.commands.onCommand.addListener(function (command) {
//     console.log('Command:', command);
// });

// chrome.pageAction.onClicked.addListener(function (browserTab) {
//     chrome.tabs.executeScript(null, { file: "js/content.js" }, function () {
//         chrome.tabs.sendMessage(browserTab.id, "Background page started.", function (response) {
//             console.log("Now double speed");
//         });
//     });

// });


// Change the icon
var icons = {
    0: "img/num/0.png",
    0.25: "img/num/0.25.png",
    0.5: "img/num/0.5.png",
    0.75: "img/num/0.75.png",
    1: "img/num/1.png",
    1.25: "img/num/1.25.png",
    1.5: "img/num/1.5.png",
    1.75: "img/num/1.75.png",
    2: "img/num/2.png",
    2.25: "img/num/2.25.png",
    2.5: "img/num/2.5.png",
    2.75: "img/num/2.75.png",
    3: "img/num/3.png",
    "default": "img/num/default.png"
};

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
        // Enable the page-action for the requesting tab.
        chrome.pageAction.show(sender.tab.id);
    } else if ((msg.from === 'content') && (msg.subject === 'changeIcon')) {
        chrome.pageAction.setIcon({ path: icons[msg.icon], tabId: sender.tab.id });
    }
    return Promise.resolve("Dummy response to keep the console quiet");
});