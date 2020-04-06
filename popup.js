// Reference:
// https://stackoverflow.com/questions/20019958/chrome-extension-how-to-send-data-from-content-script-to-popup-html


// Update the relevant fields with the new data.
const setInfo = info => {
    // document.getElementById('total').textContent = info.total;
    // document.getElementById('inputs').textContent = info.inputs;
    // document.getElementById('buttons').textContent = info.buttons;
};

function updateSpinner(change) {
    var speedObj = document.getElementById("speed");
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
window.addEventListener('DOMContentLoaded', () => {
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        // ...and send a request for the DOM info...
        chrome.tabs.sendMessage(
            tabs[0].id,
            { from: 'popup', subject: 'Info' },
            setInfo);
    });
});

window.addEventListener('load', function load(event) {
    var downButton = document.getElementById('down');
    downButton.addEventListener('click', function () { updateSpinner('down'); });
});

window.addEventListener('load', function load(event) {
    var upButton = document.getElementById('up');
    upButton.addEventListener('click', function () { updateSpinner('up'); });
});

window.addEventListener('load', function load(event) {
    var resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function () {
        var speedObj = document.getElementById("speed");
        // TODO: Add pulling value from saved storage
        speedObj.value = 1;

    });
});

window.addEventListener('load', function load(event) {
    var saveButton = document.getElementById('save');
    saveButton.addEventListener('click', function () {
        var speedObj = document.getElementById("speed");
        var value = parseFloat(speedObj.value);
        var domainObj = document.getElementById("domain");
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                from: 'popup',
                subject: 'save',
                domain: domainObj.innerHTML,
                speed: value
            });
    });
});

window.addEventListener('load', function load(event) {
    var disableButton = document.getElementById('disable');
    disableButton.addEventListener('click', function () {
        chrome.tabs.sendMessage(
            tabs[0].id,
            { from: 'popup', subject: 'disable' });
    });
});