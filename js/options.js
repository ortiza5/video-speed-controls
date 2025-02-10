let SETTINGS_FULL;
let HOTKEY_CODES;
let HOTKEY_DISABLES;

function getSettings(callback) {
  chrome.storage.local.get(["extension-settings"], (result) => {
    SETTINGS_FULL = result["extension-settings"];
    HOTKEYS_DISABLED = SETTINGS_FULL.hotkeys.disables;
    HOTKEY_CODES = SETTINGS_FULL.hotkeys.codes;
    console.log(HOTKEY_CODES);
    if (typeof callback === "function") {
      callback();
    }
  });
}

function populateFields() {
  const hotkeyDivs = document.querySelectorAll(".setting[data-type='shortcut']");
  hotkeyDivs.forEach(setHotkeyBtn);
  document.getElementById("notification-position").value = SETTINGS_FULL.notification.position;
  document.getElementById("notification-bg-color").value = SETTINGS_FULL.notification.background;
  document.getElementById("notification-text-color").value = SETTINGS_FULL.notification.text;
  document.getElementById("playback-speed").value = SETTINGS_FULL.speed;
  document.getElementById("notification-layer").value = SETTINGS_FULL.notification.layer;
  document.getElementById("disable-slower").checked = SETTINGS_FULL.hotkeys.disables.slower;
  document.getElementById("disable-normal").checked = SETTINGS_FULL.hotkeys.disables.normal;
  document.getElementById("disable-faster").checked = SETTINGS_FULL.hotkeys.disables.faster;
  document.getElementById("disable-pause").checked = SETTINGS_FULL.hotkeys.disables.pause;
  document.getElementById("disable-skip-back").checked = SETTINGS_FULL.hotkeys.disables["skip-back"];
  document.getElementById("disable-skip-forward").checked = SETTINGS_FULL.hotkeys.disables["skip-forward"];
}

function enterNewHotkey(event) {
  const element = event.currentTarget;
  element.removeEventListener("click", enterNewHotkey);
  element.setAttribute("class", "btn btn-primary");
  let textArea = element.children[0];
  textArea.innerHTML = `
          Enter the shortcut
  `;

  let keysDown = new Set();
  let keysFinal;
  window.addEventListener("keydown", keyPress);
  window.addEventListener("keyup", keyRelease);

  function keyPress(e) {
    e.preventDefault();
    e.stopPropagation();

    // hitting escape cancels input
    if (e.key.toLowerCase() === "escape") {
      window.removeEventListener("keydown", keyPress);
      window.removeEventListener("keyup", keyRelease);
      setHotkeyBtn(element.parentNode);
    }
    keysDown.add(e.key.toLowerCase(), keysDown.size);
    console.log(keysDown);
    textArea.innerHTML = formatHotkeys(keysDown);
    keysFinal = new Set(keysDown);
  }

  function keyRelease(e) {
    keysDown.delete(e.key.toLowerCase());

    // once no more keys are pressed, the final combo is recorded
    if (keysDown.size === 0) {
      window.removeEventListener("keydown", keyPress);
      window.removeEventListener("keyup", keyRelease);
      updateHotkey(element, [...keysFinal]);
    }
  }
}

function updateHotkey(element, newVal) {
  const parentSection = element.parentNode;
  parentSection.removeChild(element);
  let newSettings = SETTINGS_FULL;
  newSettings.hotkeys.codes[parentSection.id] = newVal;
  chrome.storage.local.set({ "extension-settings": newSettings }, () => {
    setHotkeyBtn(parentSection);
    // TODO: Send message to content scripts that settings updated
  });
}

function formatHotkeys(set1) {
  const replaceTable = {
    Control: "Ctrl",
    Arrowup: "&uarr;",
    Arrowright: "&rarr;",
    Arrowdown: "&darr;",
    Arrowleft: "&larr;",
    "  ": " Space",
    Pageup: "PgUp",
    Pagedown: "PgDn",
    Delete: "Del",
  };

  let keyString = [...set1].map((c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(" + ");
  keyString = keyString.replace(/Control|Arrowup|Arrowright|Arrowdown|Arrowleft|\s\s|Pageup|Pagedown|Delete/g, (match) => replaceTable[match]);
  return keyString === " " ? "Space" : keyString;
}

function setHotkeyBtn(element) {
  const el = document.createElement("div");
  // TODO: Check if hotkey combo in storage

  // if in storage print stored combo
  if (HOTKEY_CODES[element.id].length !== 0) {
    console.log(element.id);
    // delete previous btn
    let old = document.getElementById(element.id + "-hotkey");
    if (old !== null && element.parentNode) {
      old.parentNode.removeChild(old);
    }
    el.setAttribute("id", element.id + "-hotkey");
    el.setAttribute("class", "btn hotkeys");
    el.innerHTML = `
      <span class="btn-text">
            ${formatHotkeys(new Set(HOTKEY_CODES[element.id]))}
      </span>
      <button class="close-btn" title="Delete shortcut">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
              <path d="M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5 6l3.1 3.1-3 2.9 1.5 1.4L9 10.5l2.9 2.9 1.5-1.4-3-2.9"></path>
          </svg>
      </button>
    `;
    el.querySelector(".close-btn").addEventListener("click", () => updateHotkey(el, []));
    element.appendChild(el);
  } else {
    // delete any previous btn
    const old = document.getElementById(element.id + "-btn");
    if (old && element.parentNode) {
      old.parentNode.removeChild(old);
    }

    el.setAttribute("id", element.id + "-btn");
    el.setAttribute("class", "btn btn-hover");
    el.innerHTML = `
        <span class="btn-text">
            Click to type a new shortcut
        </span>
    `;
    // Add listener for new hotkey input
    el.addEventListener("click", enterNewHotkey);
    element.appendChild(el);
  }
}

getSettings(() => {
  const stateCheck = setInterval(() => {
    if (document.readyState === "complete") {
      clearInterval(stateCheck);
      populateFields();
    }
  }, 100);
});

function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    const defaultSettings = {
      hotkeys: {
        codes: {
          slower: ["F20"],
          normal: ["F21"],
          faster: ["F22"],
          pause: ["k"],
          "skip-back": ["ArrowLeft"],
          "skip-forward": ["ArrowRight"],
        },
        disables: {
          slower: false,
          normal: false,
          faster: false,
          pause: false,
          "skip-back": false,
          "skip-forward": false,
        },
      },
      increments: {
        skip: 5,
        speed: 0.25,
      },
      notification: {
        background: "#d90e00",
        layer: 0,
        position: "right",
        text: "#ffffff",
      },
      speed: 1.75,
      theme: "dark",
    };

    chrome.storage.local.set({ "extension-settings": defaultSettings }, () => {
      alert("Settings have been reset to defaults.");
      location.reload();
    });
  }
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor">
      <path d="M8 0a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm3.26 5.4a.8.8 0 0 1 .56.24.8.8 0 0 1 0 1.13l-3.59 3.59a.8.8 0 0 1-1.13 0L4.78 8.04a.8.8 0 0 1 0-1.13.8.8 0 0 1 1.13 0l1.76 1.75 3.02-3.02a.8.8 0 0 1 .57-.23z"/>
    </svg>
    ${message}
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event Listeners
document.getElementById("playback-speed").addEventListener("change", function () {
  SETTINGS_FULL.speed = parseFloat(this.value);
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("notification-layer").addEventListener("change", function () {
  SETTINGS_FULL.notification.layer = parseInt(this.value);
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-slower").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables.slower = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-normal").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables.normal = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-faster").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables.faster = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-pause").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables.pause = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-skip-back").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables["skip-back"] = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("disable-skip-forward").addEventListener("change", function () {
  SETTINGS_FULL.hotkeys.disables["skip-forward"] = this.checked;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("speed-down").addEventListener("click", function () {
  const speedInput = document.getElementById("playback-speed");
  const newValue = parseFloat(speedInput.value) - 0.25;
  if (newValue >= 0.1) {
    speedInput.value = newValue.toFixed(2);
    SETTINGS_FULL.speed = newValue;
    chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
      showNotification("Saved");
    });
  }
});

document.getElementById("speed-up").addEventListener("click", function () {
  const speedInput = document.getElementById("playback-speed");
  const newValue = parseFloat(speedInput.value) + 0.25;
  if (newValue <= 16) {
    speedInput.value = newValue.toFixed(2);
    SETTINGS_FULL.speed = newValue;
    chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
      showNotification("Saved");
    });
  }
});

document.getElementById("layer-down").addEventListener("click", function () {
  const layerInput = document.getElementById("notification-layer");
  const newValue = parseInt(layerInput.value) - 1;
  if (newValue >= 0) {
    layerInput.value = newValue;
    SETTINGS_FULL.notification.layer = newValue;
    chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
      showNotification("Saved");
    });
  }
});

document.getElementById("layer-up").addEventListener("click", function () {
  const layerInput = document.getElementById("notification-layer");
  const newValue = parseInt(layerInput.value) + 1;
  layerInput.value = newValue;
  SETTINGS_FULL.notification.layer = newValue;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("notification-position").addEventListener("change", function () {
  SETTINGS_FULL.notification.position = this.value;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("notification-bg-color").addEventListener("change", function () {
  SETTINGS_FULL.notification.background = this.value;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.getElementById("notification-text-color").addEventListener("change", function () {
  SETTINGS_FULL.notification.text = this.value;
  chrome.storage.local.set({ "extension-settings": SETTINGS_FULL }, () => {
    showNotification("Saved");
  });
});

document.querySelector(".reset-btn").addEventListener("click", resetSettings);
