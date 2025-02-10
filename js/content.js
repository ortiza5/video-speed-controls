// globals
let keysDown = new Set();
let SETTINGS;
let SPEED;
let HOTKEYS_DISABLED;
// notification
let NOTIFICATION_LAYER;
let NOTIFICATION_POSITION;
let NOTIFICATION_TEXT;
let IS_NOTIFICATION_LAYER_MAXED = false;
// site info
let DOMAIN = null;
let SCRIPT_ENABLED = false;
let OLD_VIDEOS = new Set();
let VIDEOS = new Set();
let observerTimeout;

// check the page to see if it has a video, enables the pageAction
const triggerVideoCheck = async () => {
  getVideos();
  if (VIDEOS.size >= 0) {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "showPageAction",
    });
    SCRIPT_ENABLED = true;
    if (!areSetsEqual(VIDEOS, OLD_VIDEOS)) {
      OLD_VIDEOS = new Set(VIDEOS);
      await getSettings("general");

      await getSiteSpecificSettings();
      if (isNaN(SPEED)) {
        await getSettings("site");
      }
      applySpeedToVideos();
    }
    startKeyPressListeners();
  } else {
    SCRIPT_ENABLED = false;
    removeKeyPressListeners();
  }
};

(document.body || document.documentElement).addEventListener("transitionend", triggerVideoCheck);
window.addEventListener("load", triggerVideoCheck);
window.addEventListener("popstate", triggerVideoCheck);
document.addEventListener("yt-navigate-start", triggerVideoCheck);

// MutationObserver to monitor changes in the DOM
const videoOnPageObserver = new MutationObserver((mutations) => {
  clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    let videoChanged = false;
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "attributes") {
        videoChanged = true;
      }
    });
    if (videoChanged) {
      triggerVideoCheck();
    }
  }, 100);
});

// Start observing the page for new videos
videoOnPageObserver.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src", "currentSrc"],
});

// listen for requests from the popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.from === "popup" && SCRIPT_ENABLED) {
    handlePopupRequest(request, sendResponse);
  }
  if (request.from === "options" && request.subject === "settingsUpdated") {
    await getSettings("general");
    applySpeedToVideos();
  }
});

// Handle requests from the popup
const handlePopupRequest = (request, sendResponse) => {
  if (request.subject === "needInfo") {
    getDomain();
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
    const newSpeed = isNaN(parseFloat(request.newSpeed)) ? 1 : request.newSpeed;
    getVideos();
    VIDEOS.forEach((video) => {
      setSpeed(newSpeed, video);
    });
    sendResponse({ speed: SPEED });
  } else if (request.subject === "changeLayer") {
    if (request.direction === "up" && !IS_NOTIFICATION_LAYER_MAXED) {
      NOTIFICATION_LAYER++;
    } else if (request.direction === "down") {
      NOTIFICATION_LAYER = Math.max(0, NOTIFICATION_LAYER - 1);
      IS_NOTIFICATION_LAYER_MAXED = false;
    }
    // show where the new layer will be
    getVideos();
    VIDEOS.forEach((video) => {
      tempAlert("This is the New Layer", 2000, video);
    });
    sendResponse({ layer: NOTIFICATION_LAYER });
  } else if (request.subject === "typedLayer") {
    const newLayer = isNaN(parseInt(request.newLayer)) ? NOTIFICATION_LAYER : request.newLayer;
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
};

//* BUG-FIX: Changing tabs or windows using keyboard failed to clear the keys from the keysDown set
window.onblur = () => {
  keysDown.clear();
};

// Get settings from storage
const getSettings = async (type, callback) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extension-settings"], (result) => {
      SETTINGS = result["extension-settings"];
      if (type === "site") {
        SPEED = SETTINGS.speed;
        NOTIFICATION_LAYER = SETTINGS.notification.layer;
        HOTKEYS_DISABLED = SETTINGS.hotkeys.disables;
      }

      if (callback instanceof Function) {
        callback();
      }
      resolve(SETTINGS);
    });
  });
};

// Get site-specific settings from storage
const getSiteSpecificSettings = async (callback) => {
  return new Promise((resolve) => {
    getDomain();
    chrome.storage.local.get([DOMAIN], (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.warn(chrome.runtime.lastError.message);
        } else {
          const siteSettings = result[DOMAIN];
          HOTKEYS_DISABLED = siteSettings.disables;
          NOTIFICATION_LAYER = siteSettings.layer;
          SPEED = siteSettings.speed;
        }
      } catch (err) {
        console.log("No site specific settings");
      }

      if (callback instanceof Function) {
        callback();
      }
      resolve();
    });
  });
};

// Get all video elements on the page
const getVideos = () => {
  const new_videos = document.querySelectorAll("video");
  if (new_videos.length >= 1) {
    VIDEOS = new Set(new_videos);
  } else {
    VIDEOS.clear();
  }
  return VIDEOS;
};

// Get the domain of the current page
const getDomain = () => {
  DOMAIN = window.location.origin.replace(/(^\w+:|^\w+)\/\//, "");
  return DOMAIN;
};

// Set video to the speed and give a notification, restricts available speeds
const setSpeed = (newSpeed, video) => {
  //* BUG-FIX: playback rates below 0.07 rather than 0 were causing errors
  if (newSpeed > 16) {
    newSpeed = 16;
  } else if (newSpeed < 0.07) {
    newSpeed = 0;
  }
  // limit decimal values to 2 digits, + in front truncates 2.00 -> 2
  SPEED = +newSpeed.toFixed(2);
  if (video.playbackRate !== SPEED) {
    video.playbackRate = SPEED;
    tempAlert(`Speed: ${SPEED}`, 2000, video);
    setIcon(SPEED);
  }
};

// Increment the speed of the video
// upper limit of video speed is 16 (why did they bother going so high?)
const incSpeed = (video) => {
  const currSpeed = video.playbackRate;
  let newSpeed;
  if (currSpeed <= 16 - SETTINGS.increments.speed) {
    newSpeed = currSpeed + SETTINGS.increments.speed;
  } else {
    newSpeed = 16;
  }
  setSpeed(newSpeed, video);
};

// Decrement the speed of the video
const decSpeed = (video) => {
  const currSpeed = video.playbackRate;
  let newSpeed;
  if (currSpeed >= SETTINGS.increments.speed) {
    newSpeed = currSpeed - SETTINGS.increments.speed;
  } else {
    newSpeed = 0;
  }
  setSpeed(newSpeed, video);
};

// Apply speed to all videos
const applySpeedToVideos = () => {
  getVideos();
  VIDEOS.forEach((video) => {
    setSpeed(SPEED, video);
  });
};

// Load the correct icon for the speed
const setIcon = (speed) => {
  chrome.runtime.sendMessage({
    from: "content",
    subject: "changeIcon",
    speed: speed,
  });
};

// Toggle play/pause of the video
const playPause = (video) => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
};

// Skip forward in the video
const skipForward = (video) => {
  video.currentTime += SETTINGS.increments.skip;
};

// Skip backward in the video
const skipBackward = (video) => {
  video.currentTime -= SETTINGS.increments.skip;
};

// Show a temporary alert
const tempAlert = (msg, duration, insertAfter) => {
  // remove any old notification first
  const videoId = insertAfter.src ? insertAfter.src.replace(/[^a-zA-Z0-9]/g, "") : Math.random().toString(36).substr(2, 9);
  const elementId = `speed-notification-${videoId}`;
  const element = document.getElementById(elementId);
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  // make the notification
  const el = document.createElement("div");
  el.setAttribute(
    "style",
    `background: ${SETTINGS.notification.background};
     position: absolute;
     top: 0px;
     ${SETTINGS.notification.position === "left" ? "left: 0;" : "right: 0;"}
     padding: 5px 16px;
     color: ${SETTINGS.notification.text};
     box-shadow: 0px 0px 3px rgba(0,0,0,0.07);
     opacity: 0.9;
     transition: opacity 500ms ease;
     z-index: 9999;
     `
  );
  el.setAttribute("id", elementId);
  el.innerHTML = msg;
  // go up the specified number of parents
  let count = 0;
  while (count < NOTIFICATION_LAYER) {
    if (insertAfter.parentNode.parentNode.parentNode) {
      insertAfter = insertAfter.parentNode;
      count++;
    } else {
      NOTIFICATION_LAYER = count;
      IS_NOTIFICATION_LAYER_MAXED = true;
      break;
    }
  }
  // insert the notification
  insertAfter.insertAdjacentElement("afterend", el);

  // fade out the notification
  setTimeout(() => {
    el.style.opacity = 0;
  }, duration / 2);
  setTimeout(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, duration);
};

// Check if set values match array values, not case sensitive
const setArrayMatch = (set1, array1) => {
  if (set1.size !== array1.length) return false;
  let i = 0;
  for (const element of set1) {
    if (element.toLowerCase() !== array1[i].toLowerCase()) return false;
    i++;
  }
  return true;
};

// Check if two sets are equal
const areSetsEqual = (a, b) => {
  if (a.size !== b.size) return false;
  for (const c of a) if (!b.has(c)) return false;
  return true;
};

// Handle key press events
const keyPress = (e) => {
  keysDown.add(e.key.toLowerCase());
  const target = e.target || e.srcElement;
  if (target.tagName === "INPUT" || target.className === "comment-simplebox-text") {
    return;
  }

  VIDEOS.forEach((video) => {
    if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["slower"]) && !HOTKEYS_DISABLED["slower"]) {
      decSpeed(video);
    } else if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["normal"]) && !HOTKEYS_DISABLED["normal"]) {
      setSpeed(1, video);
    } else if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["faster"]) && !HOTKEYS_DISABLED["faster"]) {
      incSpeed(video);
    } else if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["pause"]) && !HOTKEYS_DISABLED["pause"]) {
      playPause(video);
    } else if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["skip-back"]) && !HOTKEYS_DISABLED["skip-back"]) {
      skipBackward(video);
    } else if (setArrayMatch(keysDown, SETTINGS.hotkeys.codes["skip-forward"]) && !HOTKEYS_DISABLED["skip-forward"]) {
      skipForward(video);
    }
  });
};

// Handle key release events
const keyRelease = (e) => {
  keysDown.delete(e.key.toLowerCase());
};

// Start listening for key press events
const startKeyPressListeners = () => {
  window.addEventListener("keydown", keyPress);
  window.addEventListener("keyup", keyRelease);
};

// Stop listening for key press events
const removeKeyPressListeners = () => {
  window.removeEventListener("keydown", keyPress);
  window.removeEventListener("keyup", keyRelease);
  videoOnPageObserver.disconnect();
};
