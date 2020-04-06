// globals
var buttonAdded = false;
var playerType = null;
var enabled = true;

// check the page to see if it has a video, enables the pageAction
(document.body || document.documentElement).addEventListener('transitionend', function () {
    var returnVal = getVideo();
    var video = returnVal[0], type = returnVal[1];
    if (video != null) {
        chrome.runtime.sendMessage({
            from: 'content',
            subject: 'showPageAction'
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
function getVideo() {
    if (self === top) {
        var videos = document.getElementsByTagName("video");
        if (videos.length >= 1) {
            getVideoType();
            return [videos[0], "main"];
        }
    } else {
        var videos = document.getElementsByTagName("video");
        if (videos.length >= 1) {
            getVideoType();
            return [videos[0], "iframe"];
        }
    }

    return [null, null]; // if a video doesn't exist
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
function setSpeed(newSpeed) {
    var returnVal = getVideo();
    var video = returnVal[0], type = returnVal[1];
    if (self === top) {
        if (video != null && type === "main") {
            video.playbackRate = newSpeed;
            tempAlert("Speed: " + newSpeed, 2000, "main");
            setIcon(newSpeed);
            controlsIcon(newSpeed);
        }
    } else {
        if (video != null && type === "iframe") {
            video.playbackRate = newSpeed;
            tempAlert("Speed: " + newSpeed, 2000, "iframe");
            setIcon(newSpeed);
            controlsIcon(newSpeed);
        }
    }
}

// if a video exists, increment the speed by 0.25
// upper limit of video speed is 16 (why did they bother going so high?)
function incSpeed() {
    var returnVal = getVideo();
    var video = returnVal[0], type = returnVal[1];
    if (video != null && type === "main") {
        var currSpeed = video.playbackRate;
        if (currSpeed <= 15.75) {
            var newSpeed = currSpeed + 0.25;
        } else {
            var newSpeed = 16;
        }
        setSpeed(newSpeed);
    }
    if (parent === top) {
        if (video != null && type === "iframe") {
            var currSpeed = video.playbackRate;
            if (currSpeed <= 15.75) {
                var newSpeed = currSpeed + 0.25;
            } else {
                var newSpeed = 16;
            }
            setSpeed(newSpeed);
        }
    }
}

// if a video exists, decrement the speed by 0.25
// lower limit of video speed is 0
function decSpeed() {
    var returnVal = getVideo();
    var video = returnVal[0], type = returnVal[1];
    if (video != null && type === "main") {
        var currSpeed = video.playbackRate;
        if (currSpeed >= 0.25) {
            var newSpeed = currSpeed - 0.25;
        } else {
            var newSpeed = 0;
        }
        setSpeed(newSpeed);
    }
    if (parent === top) {
        if (video != null && type === "iframe") {
            var currSpeed = video.playbackRate;
            if (currSpeed >= 0.25) {
                var newSpeed = currSpeed - 0.25;
            } else {
                var newSpeed = 0;
            }
            setSpeed(newSpeed);
        }
    }
}

// loads the correct icon for the speed
function setIcon(speed) {
    if (speed <= 3) {
        chrome.runtime.sendMessage({
            from: 'content',
            subject: 'changeIcon',
            icon: speed
        });
    } else {
        chrome.runtime.sendMessage({
            from: 'content',
            subject: 'changeIcon',
            icon: 'default'
        });
    }
}

function controlsIcon(speed) {
    // youtube
    if (playerType === "youtube") {
        var controls = document.getElementsByClassName('ytp-right-controls');
        if (controls !== null && buttonAdded === false) {
            var buttonHTML = `
        <button class="ytp-playbackspeed-button ytp-button" data-tooltip-target-id="ytp-playbackspeed-button"
            aria-label="Playback Speed" title="Playback Speed">
            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
                <use class="ytp-svg-shadow" xlink:href="#ytp-id-21"></use>
                <path
                    d="M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z"
                    fill="#fff" id="ytp-id-21"></path>
            </svg>
        </button>`;
            controls[0].insertAdjacentHTML('afterbegin', buttonHTML);
            buttonAdded = true;
            return;
        }
    }

    // jwplayer
    if (playerType === "jwplayer") {

    }
}

// Toggles play pause of video
function playPause() {
    // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
    if (playerType !== "youtube") {
        var returnVal = getVideo();
        var video = returnVal[0], type = returnVal[1];
        if (video != null && type === "main") {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
        if (parent === top) {
            if (video != null && type === "iframe") {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            }
        }
    }
}

// toggles fullscreen of video
function toggleFullscreen() {
    var video = getVideo();
    if (video != null) {

    }
}

// function toggleFullScreen() {
//     var video = getVideo();
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
document.addEventListener("keydown", hotKey);

function hotKey(e) {
    if (enabled) {
        var keyCode = e.keyCode;
        const target = e.target || e.srcElement;
        if (target.tagName === 'INPUT' || target.className === 'comment-simplebox-text') { return; }

        // window.setTimeout(function () {
        //     videos[0].focus();
        // }, 0);

        if (keyCode == 132) { // F21
            decSpeed();
        } else if (keyCode == 133) { // F22
            setSpeed(1);
        } else if (keyCode == 134) { // F23
            incSpeed();
        } else if (keyCode == 75) { // k
            playPause();
        } // else if (keyCode == 70) { // f
        //     toggleFullscreen();
        // }
    }
}

// Notification to show alert
function tempAlert(msg, duration, type) {
    if (self === top) {
        if (type === "main") {
            // remove any old notification first
            var element = document.getElementById("speed-notification123");
            if (element !== null && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            var el = document.createElement("div");
            el.setAttribute("style", "background:#d90e00;position:absolute;top:0px;right:0%;padding:5px 16px;color:#fff;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.9;transition: opacity 500ms ease;z-index: 999;");
            el.setAttribute("id", "speed-notification123")
            el.innerHTML = msg;
            if (playerType === "youtube") {
                var toAddTo = document.getElementsByClassName("html5-video-player")[0];
            } else if (playerType === "jwplayer") {
                var toAddTo = document.getElementsByClassName("jwplayer")[0];
            } else {
                var toAddTo = document.body;
            }
            toAddTo.appendChild(el);
            setTimeout(function () {
                el.style.opacity = 0;
            }, duration / 2);
            setTimeout(function () {
                if (el !== null && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }, duration);
        }
    } else {
        if (type === "iframe") {
            // remove any old notification first
            var element = document.getElementById("speed-notification123");
            if (element !== null && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            var el = document.createElement("div");
            el.setAttribute("style", "background:#d90e00;position:absolute;top:0px;right:0%;padding:5px 16px;color:#fff;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.9;transition: opacity 500ms ease;z-index: 999;");
            el.setAttribute("id", "speed-notification123")
            el.innerHTML = msg;
            if (playerType === "youtube") {
                var toAddTo = document.getElementsByClassName("html5-video-player")[0];
            } else if (playerType === "jwplayer") {
                var toAddTo = document.getElementsByClassName("jwplayer")[0];
            } else {
                var toAddTo = document.body;
            }
            toAddTo.appendChild(el);
            setTimeout(function () {
                el.style.opacity = 0;
            }, duration / 2);
            setTimeout(function () {
                if (el !== null && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }, duration);
        }
    }
}