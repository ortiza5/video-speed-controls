// document.addEventListener('play', () => doubleSpeed());

// var vid = document.getElementsByTagName("video")[0];
// vid.onplay = function () {
//     alert("The video has started to play");
// };


// window.addEventListener("spfdone", doubleSpeed(1)); // old youtube design, just in case    
// window.addEventListener("yt-navigate-finish", doubleSpeed()); // new youtube design
document.addEventListener("DOMContentLoaded", setSpeed(2)); // one-time early processing
// document.getElementsByTagName("video")[0].addEventListener('play', function () { alert('working'); });
// document.addEventListener('click', () => doubleSpeed());

function setSpeed(newSpeed) {
    document.getElementsByTagName("video")[0].playbackRate = newSpeed;
    // chrome.browserAction.setIcon({path:"my-icon.png"});
}



document.addEventListener("keydown", hotKey);

function hotKey(e) {
    var keyCode = e.keyCode;
    const target = e.target || e.srcElement;
    if (target.tagName === 'INPUT' || target.className === 'comment-simplebox-text') { return; }
    if (keyCode == 71) { // g
        setSpeed(2);
        tempAlert("Speed: 2", 1000);
    } else if (keyCode == 72) { // h
        setSpeed(1);
        tempAlert("Speed: 1", 1000);
    }
}

function tempAlert(msg, duration) {
    var el = document.createElement("div");
    el.setAttribute("style", "background:#404040;position:absolute;top:58px;left:50%;padding:5px 16px;color:#fff;border-radius:3px;box-shadow:0px 0px 3px rgba(0,0,0,0.07);opacity: 0.7;transition: opacity 1000ms ease;");
    el.innerHTML = msg;
    document.body.appendChild(el);
    setTimeout(function () {
        el.parentNode.removeChild(el);
    }, duration);

}