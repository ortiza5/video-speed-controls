// Reference:
// https://stackoverflow.com/questions/20019958/chrome-extension-how-to-send-data-from-content-script-to-popup-html

// Update the relevant fields with the new data.
function updateValues(info) {
  document.getElementById("video-speed").value = info.speed;
  document.getElementById("website-domain").innerHTML = info.domain;
}

function updateSpinner(change, tabID) {
  let speedObj = document.getElementById("video-speed");
  chrome.tabs.sendMessage(tabID, { from: "popup", subject: "changeSpeed", direction: change }, function (response) {
    speedObj.value = response.speed;
  });
}

// Once the DOM is ready...
window.addEventListener("DOMContentLoaded", function () {
  // get the active tab
  let params = {
    active: true,
    currentWindow: true,
  };
  chrome.tabs.query(params, function (tabs) {
    let tabID = tabs[0].id;
    // send a request for the DOM info
    chrome.tabs.sendMessage(tabID, { from: "popup", subject: "needInfo" }, updateValues);

    // Video Speed Down Button
    let downButton = document.getElementById("down");
    downButton.addEventListener("click", function () {
      updateSpinner("down", tabID);
    });

    // Video Speed Up Button
    let upButton = document.getElementById("up");
    upButton.addEventListener("click", function () {
      updateSpinner("up", tabID);
    });

    let speedInput = document.getElementById("video-speed");
    speedInput.onchange = function (event) {
      chrome.tabs.sendMessage(
        tabID,
        { from: "popup", subject: "typedSpeed", newSpeed: parseFloat(this.value) },
        function (response) {
          speedInput.value = response.speed;
        }
      );
    };
  });
});

// chrome.runtime.onMessage.addListener(function (msg) {
//   if (msg.from === "content" && msg.subject === "popupUpdate") {
//     updateValues(msg.info);
//   }
//   return Promise.resolve("Dummy response to keep the console quiet");
// });
