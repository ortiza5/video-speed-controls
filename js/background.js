chrome.runtime.onInstalled.addListener(function () {
  let settings = {
    hotkeys: {
      codes: {
        slower: ["F21"],
        normal: ["F22"],
        faster: ["F23"],
        pause: ["k"],
        "skip-back": ["ArrowLeft"],
        "skip-forward": ["ArrowRight"],
      },
      disables: {
        slower: false,
        normal: false,
        faster: false,
        pause: false,
        "skip-back": false,
        "skip-forward": false,
      },
    },
    increments: {
      skip: 5,
      speed: 0.25,
    },
    notification: {
      background: "#d90e00",
      layer: 0,
      position: "right",
      text: "#fff",
    },
    speed: 1.75,
  };

  let youtube = {
    disables: {
      slower: false,
      normal: false,
      faster: false,
      pause: true,
      "skip-back": true,
      "skip-forward": true,
    },
    layer: 1,
    speed: 2,
  };
  chrome.storage.local.set({ "extension-settings": settings }, function () {
    console.log("Initial setting set...");
  });
  chrome.storage.local.set({ "www.youtube.com": youtube }, function () {
    console.log("Youtube setting set...");
  });
});

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
