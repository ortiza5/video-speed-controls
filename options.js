let keyString = "";
let displayKeys = `
        <div class="hotkeys btn" id="slower-btn">
            <span class="shortcut-text">
                ${keyString}
            </span>
            <button class="close" title="Delete shortcut">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                    <path d="M13.5 6l-1.4-1.4-3.1 3-3.1-3L4.5 6l3.1 3.1-3 2.9 1.5 1.4L9 10.5l2.9 2.9 1.5-1.4-3-2.9"></path>
                </svg>
            </button>

        </div>
    `;

function populateFields() {
  let hotkeyDivs = document.querySelectorAll(".shortcut");
  hotkeyDivs.forEach((hotkeyDiv) => {
    let el = document.createElement("div");
    // TODO: Check if hotkey combo in storage
    // if in storage print stored combo
    if (false) {
      el.setAttribute("id", hotkeyDiv.id + "-hotkey");
      el.setAttribute("class", "btn hotkeys");
    } else {
      el.setAttribute("id", hotkeyDiv.id + "-btn");
      el.setAttribute("class", "btn btn-hov");
      el.innerHTML = `
            <span class="shortcut-text">
                Click to type a new shortcut
            </span>
        `;
      // Add listner for new hotkey input
      el.addEventListener("click", enterNewHotkey);
      hotkeyDiv.appendChild(el);
    }
  });
}

function enterNewHotkey(event) {
  let element = event.currentTarget;
  element.removeEventListener("click", enterNewHotkey);
  element.setAttribute("class", "btn btn-enter");
  let textArea = element.children[0];
  textArea.innerHTML = `
          Enter the shortcut
  `;

  let replaceTable = {
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

  let keysDown = new Set();
  let keysFinal;
  window.addEventListener("keydown", keyPress);
  window.addEventListener("keyup", keyRelease);

  function keyPress(e) {
    e.preventDefault();
    e.stopPropagation();
    keysDown.add(e.key.toLowerCase(), keysDown.size);
    console.log(keysDown);
    let keyString = [...keysDown].map((c) => c.slice(0, 1).toUpperCase() + c.slice(1)).join(" + ");
    keyString = keyString.replace(
      /Control|Arrowup|Arrowright|Arrowdown|Arrowleft|\s\s|Pageup|Pagedown|Delete/g,
      function (match) {
        return replaceTable[match];
      }
    );
    keyString = keyString === " " ? "Space" : keyString;
    textArea.innerHTML = keyString;
    keysFinal = new Set(keysDown);
  }
  function keyRelease(e) {
    keysDown.delete(e.key.toLowerCase());
    if (keysDown.size === 0) {
      // TODO: Save to storage
      window.removeEventListener("keydown", keyPress);
      window.removeEventListener("keyup", keyRelease);
    }
  }
}

// Once the DOM is ready...
window.addEventListener("DOMContentLoaded", populateFields);
