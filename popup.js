// Reference:
// https://stackoverflow.com/questions/20019958/chrome-extension-how-to-send-data-from-content-script-to-popup-html

// Update the relevant fields with the new data.
function updateValues(info) {
  document.getElementById("video-speed").textContent = info.speed;
  document.getElementById("website-domain").value = info.domain;
  // document.getElementById('buttons').textContent = info.buttons;
}

function updateSpinner(change) {
  var speedObj = document.getElementById("video-speed");
  var value = parseFloat(speedObj.value);
  if (change == "down") {
    if (value >= 0.25) {
      value = value - 0.25;
    } else {
      value = 0;
    }
  } else {
    if (value <= 15.75) {
      value = value + 0.25;
    } else {
      value = 16;
    }
  }
  speedObj.value = value;
}

// Once the DOM is ready...
window.addEventListener("DOMContentLoaded", () => {
  // ...query for the active tab...
  let params = {
    active: true,
    currentWindow: true,
  };
  chrome.tabs.query(params, function (tabs) {
    // ...and send a request for the DOM info...
    chrome.tabs.sendMessage(tabs[0].id, { from: "popup", subject: "Info" }, updateValues);

    // Button to Disable the Controls for a Website
    var disableButton = document.getElementById("disable");
    disableButton.addEventListener("click", function () {
      chrome.tabs.sendMessage(tabs[0].id, { from: "popup", subject: "disable" });
    });
  });

  // Video Speed Down Button
  var downButton = document.getElementById("down");
  downButton.addEventListener("click", function () {
    updateSpinner("down");
  });

  // Video Speed Up Button
  var upButton = document.getElementById("up");
  upButton.addEventListener("click", function () {
    updateSpinner("up");
  });

  // Button to Reset Video Speed
  var resetButton = document.getElementById("reset");
  resetButton.addEventListener("click", function () {
    var speedObj = document.getElementById("speed");
    // TODO: Add pulling value from saved storage
    speedObj.value = 1;
  });

  // Button to Save Video Speed for a Website
  var saveButton = document.getElementById("save");
  saveButton.addEventListener("click", function () {
    var speedObj = document.getElementById("video-speed");
    var value = parseFloat(speedObj.value);
    var domainObj = document.getElementById("website-domain").innerHTML;
    // TODO: Save to localStorage
  });
});
