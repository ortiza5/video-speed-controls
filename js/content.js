// globals
var buttonAdded = false;
var playerType = null;
var enabled = true;

// check the page to see if it has a video, enables the pageAction
(document.body || document.documentElement).addEventListener("transitionend", function () {
  var videos = getVideos();
  if (videos) {
    chrome.runtime.sendMessage({
      from: "content",
      subject: "showPageAction",
    });
  } else {
    enabled = false;
  }
});

// chrome.runtime.onMessage.addListener(function () {

//     return Promise.resolve("Dummy response to keep the console quiet");
// });

// gets the video from either the video or iframe route
// RETURNS: Video element -or- null if their isn't a video
function getVideos() {
  var videos = document.getElementsByTagName("video");
  if (videos.length >= 1) {
    getVideoType();
    return Array.from(videos);
  }

  return; // if a video doesn't exist
}

// set the global type of player
function getVideoType() {
  var type = document.getElementsByClassName("jw-controlbar");
  if (type.length >= 1) {
    playerType = "jwplayer";
    return;
  }
  // youtube
  type = document.getElementsByClassName("ytp-chrome-controls");
  if (type.length >= 1) {
    playerType = "youtube";
    return;
  }
}

// if a video exists, set it to the speed and give a notification
function setSpeed(newSpeed, video) {
  video.playbackRate = newSpeed;
  tempAlert("Speed: " + newSpeed, 2000, video);
  setIcon(newSpeed);
  //   controlsIcon(newSpeed);
}

// if a video exists, increment the speed by 0.25
// upper limit of video speed is 16 (why did they bother going so high?)
function incSpeed(video) {
  var currSpeed = video.playbackRate;
  if (currSpeed <= 15.75) {
    var newSpeed = currSpeed + 0.25;
  } else {
    var newSpeed = 16;
  }
  setSpeed(newSpeed, video);
}

// if a video exists, decrement the speed by 0.25
// lower limit of video speed is 0
function decSpeed(video) {
  var currSpeed = video.playbackRate;
  if (currSpeed >= 0.25) {
    var newSpeed = currSpeed - 0.25;
  } else {
    var newSpeed = 0;
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

// function controlsIcon(speed) {
//   // youtube
//   if (playerType === "youtube") {
//     var controls = document.getElementsByClassName("ytp-right-controls");
//     if (controls !== null && buttonAdded === false) {
//       var buttonHTML = `
//         <button class="ytp-playbackspeed-button ytp-button" data-tooltip-target-id="ytp-playbackspeed-button"
//             aria-label="Playback Speed" title="Playback Speed">
//             <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
//                 <use class="ytp-svg-shadow" xlink:href="#ytp-id-21"></use>
//                 <path
//                     d="M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z"
//                     fill="#fff" id="ytp-id-21"></path>
//             </svg>
//         </button>`;
//       controls[0].insertAdjacentHTML("afterbegin", buttonHTML);
//       buttonAdded = true;
//       return;
//     }
//   }

//   // jwplayer
//   if (playerType === "jwplayer") {
//   }
// }

// Toggles play pause of video
function playPause(video) {
  // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
  if (playerType !== "youtube") {
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
  if (playerType !== "youtube") {
    video.currentTime += 5;
  }
}

//
function skipBackward(video) {
  // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
  if (playerType !== "youtube") {
    video.currentTime -= 5;
  }
}

// function toggleFullScreen() {
//     var video = getVideos();
//     if (video != null) {
//         if (!document.webkitFullScreen) {
//             video.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
//             document.webkitFullScreen = true;
//         } else {
//             document.webkitCancelFullScreen();
//         }
//     }
// }

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
      if ("F21" in keysDown) {
        decSpeed(video);
      } else if ("F22" in keysDown) {
        setSpeed(1, video);
      } else if ("F23" in keysDown) {
        incSpeed(video);
      } else if ("k" in keysDown) {
        playPause(video);
      } else if ("ArrowLeft" in keysDown) {
        skipBackward(video);
      } else if ("ArrowRight" in keysDown) {
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
  var element = document.getElementById("speed-notification123");
  if (element !== null && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  var el = document.createElement("div");
  el.setAttribute(
    "style",
    "background:#d90e00;position:absolute;top:0px;left:0%;padding:5px 16px;color:#fff;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.9;transition: opacity 500ms ease;z-index: 9999;"
  );
  el.setAttribute("id", "speed-notification123");
  el.innerHTML = msg;
  //   if (playerType === "youtube") {
  //     var toAddTo = document.getElementsByClassName("html5-video-player")[0];
  //   } else if (playerType === "jwplayer") {
  //     var toAddTo = document.getElementsByClassName("jwplayer")[0];
  //   } else {
  //     var toAddTo = document.body;
  //   }
  //   toAddTo.appendChild(el);
  insertAfter.insertAdjacentElement("afterend", el);
  setTimeout(function () {
    el.style.opacity = 0;
  }, duration / 2);
  setTimeout(function () {
    if (el !== null && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, duration);
}
