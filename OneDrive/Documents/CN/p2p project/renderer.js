const { ipcRenderer } = require("electron");

ipcRenderer.on("message", (_, message) => {
    const chat = document.getElementById("chat");
    chat.innerHTML += `<p>${message}</p>`;
});

function sendMessage() {
    const input = document.getElementById("message");
    ipcRenderer.send("send-message", input.value);
    input.value = "";
}
