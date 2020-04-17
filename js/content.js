// globals
var PLAYER_TYPE = null;
var SCRIPT_ENABLED = false;
var DOMAIN = null;
var SPEED = 1;
var NOTIFICATION_LAYER = 0;
var IS_NOTIFICATION_LAYER_MAXED = false;
// hotkeys
var HOTKEYS_DISABLED = {
  slower: false,
  normal: false,
  faster: false,
  pause: false,
  "skip-back": false,
  "skip-forward": false,
};
// increments
var SPEED_INC = 0.25;
var SKIP_INC = 5;

// check the page to see if it has a video, enables the pageAction
(document.body || document.documentElement).addEventListener("transitionend", function () {
  let videos = getVideos();
  if (videos) {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "showPageAction",
    });
    SCRIPT_ENABLED = true;
  } else {
    SCRIPT_ENABLED = false;
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
      let videos = getVideos();
      if (videos) {
        if (request.direction === "up") {
          videos.forEach((video) => {
            incSpeed(video);
          });
        } else if (request.direction === "down") {
          videos.forEach((video) => {
            decSpeed(video);
          });
        }
        sendResponse({ speed: SPEED });
      }
    } else if (request.subject === "typedSpeed") {
      let newSpeed = isNaN(parseFloat(request.newSpeed)) ? 1 : request.newSpeed;
      let videos = getVideos();
      if (videos) {
        videos.forEach((video) => {
          setSpeed(newSpeed, video);
        });
      }
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
      let videos = getVideos();
      if (videos) {
        videos.forEach((video) => {
          tempAlert("This is the New Layer", 2000, video);
        });
      }
      sendResponse({ layer: NOTIFICATION_LAYER });
    } else if (request.subject === "typedLayer") {
      let newLayer = isNaN(parseInt(request.newLayer)) ? NOTIFICATION_LAYER : request.newLayer;
      if (newLayer >= 0) {
        NOTIFICATION_LAYER = newLayer;
      }
      // show where the new layer will be
      let videos = getVideos();
      if (videos) {
        videos.forEach((video) => {
          tempAlert("This is the New Layer", 2000, video);
        });
      }
      sendResponse({ layer: NOTIFICATION_LAYER });
    } else if (request.subject === "checkboxChange") {
      HOTKEYS_DISABLED[request.id] = request.state;
      sendResponse({ id: request.id, newState: HOTKEYS_DISABLED[request.id] });
    }
  }
});

// gets the video from either the video or iframe route
// RETURNS: Video element -or- null if their isn't a video
function getVideos() {
  let videos = document.getElementsByTagName("video");
  if (videos.length >= 1) {
    getVideoType();
    return Array.from(videos);
  }

  return; // if a video doesn't exist
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
  if (speed <= 3) {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "changeIcon",
      icon: speed,
    });
  } else {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "changeIcon",
      icon: "default",
    });
  }
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

// Hotkeys for different actions
let keysDown = {};
window.onkeydown = function (e) {
  // if (e.key in ["F21", "F22", "F23", "k", "ArrowLeft", "ArrowRight"]) {
  //   e.preventDefault();
  //   e.stopPropagation();
  // }
  keysDown[e.key] = true;
  let target = e.target || e.srcElement;
  if (target.tagName === "INPUT" || target.className === "comment-simplebox-text") {
    return;
  }

  let videos = getVideos();
  if (videos) {
    videos.forEach((video) => {
      if ("F21" in keysDown && !HOTKEYS_DISABLED["slower"]) {
        decSpeed(video);
      } else if ("F22" in keysDown && !HOTKEYS_DISABLED["normal"]) {
        setSpeed(1, video);
      } else if ("F23" in keysDown && !HOTKEYS_DISABLED["faster"]) {
        incSpeed(video);
      } else if ("k" in keysDown && !HOTKEYS_DISABLED["pause"]) {
        playPause(video);
      } else if ("ArrowLeft" in keysDown && !HOTKEYS_DISABLED["skip-back"]) {
        skipBackward(video);
      } else if ("ArrowRight" in keysDown && !HOTKEYS_DISABLED["skip-forward"]) {
        skipForward(video);
      }
    });
  }
};

window.onkeyup = function (e) {
  keysDown[e.key] = false;
  delete keysDown[e.key];
};

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

// checking array equality
function arrayMatch(arr1, arr2) {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) return false;
  // Check if all items exist and are in the same order
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  // Otherwise, return true
  return true;
}
