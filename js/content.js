// globals
var keysDown = new Set();
var SETTINGS_FULL;
var SPEED = 1;
// hotkeys
var HOTKEY_CODES;
var HOTKEYS_DISABLED;
// increments
var SPEED_INC;
var SKIP_INC;
// notification
var NOTIFICATION_BACKGROUND;
var NOTIFICATION_LAYER;
var NOTIFICATION_POSITION;
var NOTIFICATION_TEXT;
var IS_NOTIFICATION_LAYER_MAXED = false;
// site info
var DOMAIN = null;
var PLAYER_TYPE = null;
var SCRIPT_ENABLED = false;
var VIDEOS = new Set();

getSettings();

// check the page to see if it has a video, enables the pageAction
(document.body || document.documentElement).addEventListener("transitionend", function () {
  getVideos();
  if (VIDEOS.size >= 0) {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "showPageAction",
    });
    SCRIPT_ENABLED = true;
    startKeyPressListeners();
  } else {
    SCRIPT_ENABLED = false;
    removeKeyPressListeners();
  }
});

// listen for requests from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.from === "popup" && SCRIPT_ENABLED) {
    if (request.subject === "needInfo") {
      DOMAIN = window.location.origin.replace(/(^\w+:|^\w+)\/\//, "");
      sendResponse({
        speed: SPEED,
        domain: DOMAIN,
        layer: NOTIFICATION_LAYER,
        hotkeys: HOTKEYS_DISABLED,
      });
    } else if (request.subject === "changeSpeed") {
      getVideos();
      if (request.direction === "up") {
        VIDEOS.forEach((video) => {
          incSpeed(video);
        });
      } else if (request.direction === "down") {
        VIDEOS.forEach((video) => {
          decSpeed(video);
        });
      }
      sendResponse({ speed: SPEED });
    } else if (request.subject === "typedSpeed") {
      let newSpeed = isNaN(parseFloat(request.newSpeed)) ? 1 : request.newSpeed;
      getVideos();
      VIDEOS.forEach((video) => {
        setSpeed(newSpeed, video);
      });
      sendResponse({ speed: SPEED });
    } else if (request.subject === "changeLayer") {
      if (request.direction === "up" && !IS_NOTIFICATION_LAYER_MAXED) {
        NOTIFICATION_LAYER++;
      } else if (request.direction === "down") {
        if (NOTIFICATION_LAYER >= 1) {
          NOTIFICATION_LAYER--;
        } else {
          NOTIFICATION_LAYER = 0;
        }
        IS_NOTIFICATION_LAYER_MAXED = false;
      }
      // show where the new layer will be
      getVideos();
      VIDEOS.forEach((video) => {
        tempAlert("This is the New Layer", 2000, video);
      });
      sendResponse({ layer: NOTIFICATION_LAYER });
    } else if (request.subject === "typedLayer") {
      let newLayer = isNaN(parseInt(request.newLayer)) ? NOTIFICATION_LAYER : request.newLayer;
      if (newLayer >= 0) {
        NOTIFICATION_LAYER = newLayer;
      }
      // show where the new layer will be
      getVideos();
      VIDEOS.forEach((video) => {
        tempAlert("This is the New Layer", 2000, video);
      });
      sendResponse({ layer: NOTIFICATION_LAYER });
    } else if (request.subject === "checkboxChange") {
      HOTKEYS_DISABLED[request.id] = request.state;
      sendResponse({ id: request.id, newState: HOTKEYS_DISABLED[request.id] });
    }
  }
});

//* BUG-FIX: Changing tabs or windows using keyboard failed to clear the keys from the keysDown set
window.onblur = function () {
  keysDown.clear();
};

function getSettings(callback) {
  chrome.storage.local.get(["extension-settings"], function (result) {
    SETTINGS_FULL = result["extension-settings"];
    HOTKEY_CODES = SETTINGS_FULL.hotkeys.codes;
    HOTKEYS_DISABLED = SETTINGS_FULL.hotkeys.disables;
    SKIP_INC = SETTINGS_FULL.increments.skip;
    SPEED_INC = SETTINGS_FULL.increments.speed;
    NOTIFICATION_BACKGROUND = SETTINGS_FULL.notification.background;
    NOTIFICATION_LAYER = SETTINGS_FULL.notification.layer;
    NOTIFICATION_POSITION = SETTINGS_FULL.notification.position;
    NOTIFICATION_TEXT = SETTINGS_FULL.notification.text;
    SPEED = SETTINGS_FULL.speed;

    if (callback instanceof Function) {
      callback();
    }
  });
}

function getVideos() {
  let new_videos = document.getElementsByTagName("video");
  if (new_videos.length >= 1) {
    getVideoType();
    VIDEOS = new Set(new_videos);
  }
}

// set the global type of player
function getVideoType() {
  // youtube
  type = document.getElementsByClassName("ytp-chrome-controls");
  if (type.length >= 1) {
    PLAYER_TYPE = "youtube";
  }
}

// if a video exists, set it to the speed and give a notification
function setSpeed(newSpeed, video) {
  newSpeed = newSpeed > 16 ? 16 : newSpeed < 0 ? 0 : newSpeed;
  SPEED = newSpeed;
  video.playbackRate = newSpeed;
  tempAlert("Speed: " + newSpeed, 2000, video);
  setIcon(newSpeed);
  // if (callback instanceof Function) {
  //   callback();
  // }
}

// if a video exists, increment the speed by the speed increment
// upper limit of video speed is 16 (why did they bother going so high?)
function incSpeed(video) {
  let currSpeed = video.playbackRate;
  let newSpeed;
  if (currSpeed <= 16 - SPEED_INC) {
    newSpeed = currSpeed + SPEED_INC;
  } else {
    newSpeed = 16;
  }
  setSpeed(newSpeed, video);
}

// if a video exists, decrement the speed by the speed increment
// lower limit of video speed is 0
function decSpeed(video) {
  let currSpeed = video.playbackRate;
  let newSpeed;
  if (currSpeed >= SPEED_INC) {
    newSpeed = currSpeed - SPEED_INC;
  } else {
    newSpeed = 0;
  }
  setSpeed(newSpeed, video);
}

// loads the correct icon for the speed
function setIcon(speed) {
  chrome.runtime.sendMessage({
    from: "content",
    subject: "changeIcon",
    speed: speed,
  });
}

// Toggles play pause of video
function playPause(video) {
  // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
  if (PLAYER_TYPE !== "youtube") {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
}

//
function skipForward(video) {
  // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
  if (PLAYER_TYPE !== "youtube") {
    video.currentTime += SKIP_INC;
  }
}

//
function skipBackward(video) {
  // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
  if (PLAYER_TYPE !== "youtube") {
    video.currentTime -= SKIP_INC;
  }
}

// Notification to show alert
function tempAlert(msg, duration, insertAfter) {
  // remove any old notification first
  let element = document.getElementById("speed-notification123");
  if (element !== null && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  // make the notification
  let el = document.createElement("div");
  el.setAttribute(
    "style",
    "background:#d90e00;position:absolute;top:0px;left:0%;padding:5px 16px;color:#fff;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.9;transition: opacity 500ms ease;z-index: 9999;"
  );
  el.setAttribute("id", "speed-notification123");
  el.innerHTML = msg;
  // go up the specified number of parents
  let count = 0;
  while (count < NOTIFICATION_LAYER) {
    // TODO: Sort of hacky to do 3 times, find a better way to check for root element
    if (insertAfter.parentNode.parentNode.parentNode) {
      insertAfter = insertAfter.parentNode;
      count++;
    } else {
      NOTIFICATION_LAYER = count;
      IS_NOTIFICATION_LAYER_MAXED = true;
      // break out
      count = NOTIFICATION_LAYER;
    }
  }
  // insert the notification
  insertAfter.insertAdjacentElement("afterend", el);

  // fade out the notification
  setTimeout(function () {
    el.style.opacity = 0;
  }, duration / 2);
  setTimeout(function () {
    if (el !== null && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, duration);
}

// checking equality of set values to array values, not case sensitive
function setArrayMatch(set1, array1) {
  // Check if the map and array have the same number of entries
  if (set1.size !== array1.length) return false;
  // Check if all items exist and are in the same order
  let i = 0;
  for (let element of set1) {
    if (element.toLowerCase() !== array1[i].toLowerCase()) return false;
    i++;
  }
  // Otherwise, return true
  return true;
}

// Hotkeys for different actions
function keyPress(e) {
  keysDown.add(e.key.toLowerCase());
  let target = e.target || e.srcElement;
  if (target.tagName === "INPUT" || target.className === "comment-simplebox-text") {
    return;
  }

  VIDEOS.forEach((video) => {
    if (setArrayMatch(keysDown, HOTKEY_CODES["slower"]) && !HOTKEYS_DISABLED["slower"]) {
      decSpeed(video);
    } else if (setArrayMatch(keysDown, HOTKEY_CODES["normal"]) && !HOTKEYS_DISABLED["normal"]) {
      setSpeed(1, video);
    } else if (setArrayMatch(keysDown, HOTKEY_CODES["faster"]) && !HOTKEYS_DISABLED["faster"]) {
      incSpeed(video);
    } else if (setArrayMatch(keysDown, HOTKEY_CODES["pause"]) && !HOTKEYS_DISABLED["pause"]) {
      playPause(video);
    } else if (setArrayMatch(keysDown, HOTKEY_CODES["skip-back"]) && !HOTKEYS_DISABLED["skip-back"]) {
      skipBackward(video);
    } else if (setArrayMatch(keysDown, HOTKEY_CODES["skip-forward"]) && !HOTKEYS_DISABLED["skip-forward"]) {
      skipForward(video);
    }
  });
}

function keyRelease(e) {
  keysDown.delete(e.key.toLowerCase());
}

function startKeyPressListeners() {
  window.addEventListener("keydown", keyPress);
  window.addEventListener("keyup", keyRelease);
}

function removeKeyPressListeners() {
  window.removeEventListener("keydown", keyPress);
  window.removeEventListener("keyup", keyRelease);
}
