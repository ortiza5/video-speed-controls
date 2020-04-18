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

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.from === "content" && msg.subject === "showPageAction") {
    // Enable the page-action for the requesting tab.
    chrome.pageAction.show(sender.tab.id);
  } else if (msg.from === "content" && msg.subject === "changeIcon") {
    // make icon for the speed
    let canvas = document.getElementById("icon-making-canvas");
    if (!canvas) {
      canvas = document.createElement("CANVAS");
      canvas.id = "icon-making-canvas";
      canvas.width = canvas.height = 16;
    }
    let ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(0, 0, 16, 16);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fitTextOnCanvas(ctx, msg.speed, "Roboto Condensed", 9, canvas.width);

    let imgData = ctx.getImageData(0, 0, 16, 16);

    // set the icon
    chrome.pageAction.setIcon({ imageData: imgData, tabId: sender.tab.id });
  }
  return Promise.resolve("Dummy response to keep the console quiet");
});

function fitTextOnCanvas(ctx, text, fontface, yPosition, canvasWidth) {
  // initial value
  let fontsize = 13;
  let margin = 2;
  let rightSpacing = 0.7;

  // lower the font size until the text fits the canvas
  do {
    fontsize -= 0.25;
    ctx.font = "bold " + fontsize + "px " + fontface;
  } while (ctx.measureText(text).width + margin > canvasWidth);

  // draw the text
  ctx.fillText(text, canvasWidth / 2 - rightSpacing, yPosition);
}
