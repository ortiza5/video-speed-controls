// PageAction click should make it double speed
chrome.runtime.onMessage.addListener(function () {
    var videos = document.getElementsByTagName("video");
    var iframes = document.getElementsByTagName("iframe");
    if (videos.length >= 1) {
        videos[0].playbackRate = 2;
    } else if (iframes.length >= 1) {
        videos = iframes[0].contentWindow.document.getElementsByTagName("video");
        if (videos.length >= 1) {
            videos[0].playbackRate = 2;
        }
    }
    return Promise.resolve("Dummy response to keep the console quiet");
});


// gets the video from either the video or iframe route
// RETURNS: Video element -or- null if their isn't a video
function getVideo() {
    var videos = document.getElementsByTagName("video");
    if (videos.length >= 1) {
        return [videos[0], "main"];
    }
    // var iframes = document.getElementsByTagName("iframe");
    // if (iframes.length >= 1) {
    //     for (const frame of iframes) {
    //         videos = frame.contentWindow.document.getElementsByTagName("video");
    //         if (videos.length >= 1) {
    //             return videos[0];
    //         }
    //     }
    // }

    // Code that will run only inside iframe
    if (parent === top) {
        var videos = document.getElementsByTagName("video");
        if (videos.length >= 1) {
            return [videos[0], "iframe"];
        }
    }

    return [null, null]; // if a video doesn't exist
}



// if a video exists, set it to the speed and give a notification
function setSpeed(newSpeed) {
    var video = getVideo();
    if (video != null) {
        video.playbackRate = newSpeed;
        tempAlert("Speed: " + newSpeed, 1000, false);
        setIcon(newSpeed);
    }
}

// if a video exists, increment the speed by 0.25
// upper limit of video speed is 16 (why did they bother going so high?)
function incSpeed() {
    var video = getVideo();
    if (video != null) {
        var currSpeed = video.playbackRate;
        if (currSpeed <= 15.75) {
            var newSpeed = currSpeed + 0.25;
        } else {
            var newSpeed = 16;
        }
        setSpeed(newSpeed);
    }
}

// if a video exists, decrement the speed by 0.25
// lower limit of video speed is 0
function decSpeed() {
    var video = getVideo();
    if (video != null) {
        var currSpeed = video.playbackRate;
        if (currSpeed >= 0.25) {
            var newSpeed = currSpeed - 0.25;
        } else {
            var newSpeed = 0;
        }
        setSpeed(newSpeed);
    }
}

// loads the correct icon for the speed
function setIcon(speed) {
    if (speed <= 3) {
        chrome.runtime.sendMessage(speed);
    } else {
        chrome.runtime.sendMessage("default");
    }
}

// Toggles play pause of video
function playPause() {
    // BUG-FIX: Youtube was pausing too quickly to prevent double toggling, so letting youtube handle it
    if (window.location.href.indexOf("youtube") == -1) {
        var video = getVideo();
        if (video != null) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
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
    var keyCode = e.keyCode;
    const target = e.target || e.srcElement;
    if (target.tagName === 'INPUT' || target.className === 'comment-simplebox-text') { return; }
    if (keyCode == 132) { // F21
        decSpeed();
    } else if (keyCode == 133) { // F22
        setSpeed(1);
    } else if (keyCode == 134) { // F23
        incSpeed();
    } else if (keyCode == 75) { // k
        playPause();
    } else if (keyCode == 70) { // f
        toggleFullscreen();
    }
}

// Notification to show alert
function tempAlert(msg, duration, frame) {
    if (frame) {
        var iframes = document.getElementsByTagName("iframe");
        var el = iframes[0].contentWindow.document.createElement("div");
        el.setAttribute("style", "background:#404040;position:absolute;top:58px;left:50%;padding:5px 16px;color:#fff;border-radius:3px;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.7;transition: opacity 1000ms ease;");
        el.innerHTML = msg;
        iframes[0].contentWindow.document.body.appendChild(el);
        setTimeout(function () {
            el.parentNode.removeChild(el);
        }, duration);
    } else {
        var el = document.createElement("div");
        el.setAttribute("style", "background:#404040;position:absolute;top:58px;left:50%;padding:5px 16px;color:#fff;border-radius:3px;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.7;transition: opacity 1000ms ease;");
        el.innerHTML = msg;
        document.body.appendChild(el);
        setTimeout(function () {
            el.parentNode.removeChild(el);
        }, duration);
    }
}