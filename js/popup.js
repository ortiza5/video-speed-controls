// Reference:
// https://stackoverflow.com/questions/20019958/chrome-extension-how-to-send-data-from-content-script-to-popup-html

// Update the relevant fields with the new data.
function updateValues(info) {
  document.getElementById("video-speed").value = info.speed;
  document.getElementById("website-domain").innerHTML = info.domain;
  document.getElementById("notification-layer").value = info.layer;
  let ids = Object.keys(info.hotkeys);
  ids.forEach((id) => {
    document.getElementById(id).checked = info.hotkeys[id];
  });
}

function updateSpeedSpinner(change, tabID) {
  let speedObj = document.getElementById("video-speed");
  chrome.tabs.sendMessage(tabID, { from: "popup", subject: "changeSpeed", direction: change }, function (response) {
    speedObj.value = response.speed;
  });
}

function updateLayerSpinner(change, tabID) {
  let layer = document.getElementById("notification-layer");
  chrome.tabs.sendMessage(tabID, { from: "popup", subject: "changeLayer", direction: change }, function (response) {
    layer.value = response.layer;
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
      updateSpeedSpinner("down", tabID);
    });

    // Video Speed Up Button
    let upButton = document.getElementById("up");
    upButton.addEventListener("click", function () {
      updateSpeedSpinner("up", tabID);
    });

    // Notification Layer Down Button
    let layerDownButton = document.getElementById("down-l");
    layerDownButton.addEventListener("click", function () {
      updateLayerSpinner("down", tabID);
    });

    // Notification Layer Up Button
    let layerUpButton = document.getElementById("up-l");
    layerUpButton.addEventListener("click", function () {
      updateLayerSpinner("up", tabID);
    });

    // Listner for typed in video speed
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

    // Listner for typed in notification layer
    let layerInput = document.getElementById("notification-layer");
    layerInput.onchange = function (event) {
      chrome.tabs.sendMessage(
        tabID,
        { from: "popup", subject: "typedLayer", newLayer: parseFloat(this.value) },
        function (response) {
          layerInput.value = response.layer;
        }
      );
    };

    let checkboxes = document.querySelectorAll(".hk-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.onchange = function (event) {
        chrome.tabs.sendMessage(
          tabID,
          { from: "popup", subject: "checkboxChange", id: this.id, state: this.checked },
          function (response) {
            document.getElementById(response.id).checked = response.newState;
          }
        );
      };
    });
  });
});
