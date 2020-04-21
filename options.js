let keyString = "";
let displayKeys = `
    <div class="hotkeys btn">
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

let keysDown = new Map();
window.onkeydown = function (e) {
  keysDown.set(e.key.toLowerCase(), keysDown.size);
  console.log(keysDown);
};

window.onkeyup = function (e) {
  if (keysDown.has(e.key.toLowerCase())) {
    keysDown.delete(e.key.toLowerCase());
  }
};
