const ws = new WebSocket("ws://localhost:3000");
let currentRoom = null;

function appendMessage(sender, message) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  chatBox.appendChild(messageElement);
}

function sendMessage(message) {
  const sender = currentRoom ? "Client 1" : "Client 2";
  appendMessage(sender, message);
  if (currentRoom) {
    ws.send(JSON.stringify({ type: "message", message, room: currentRoom }));
  } else {
    ws.send(JSON.stringify({ type: "message", message }));
  }
}

document.getElementById("send-button").addEventListener("click", () => {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message !== "") {
    console.log("Sending message:", message);
    sendMessage(message);
    messageInput.value = "";
  }
});

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log("Message received:", data);
  if (data.type === "message") {
    appendMessage(data.sender, data.message);
  } else if (data.type === "image") {
    const chatBox = document.getElementById("chat-box");
    const imageElement = document.createElement("img");
    imageElement.src = data.image;
    chatBox.appendChild(imageElement);
  } else if (data.type === "file") {
    const chatBox = document.getElementById("chat-box");
    const fileElement = document.createElement("a");
    fileElement.href = data.file;
    fileElement.setAttribute("download", data.fileName);
    fileElement.textContent = `${data.sender}: ${data.fileName}`;
    chatBox.appendChild(fileElement);
  } else if (data.type === "video") {
    const chatBox = document.getElementById("chat-box");
    const videoElement = document.createElement("video");
    videoElement.src = data.video;
    videoElement.controls = true;
    chatBox.appendChild(videoElement);
  } else {
    appendMessage(data.sender, data.message);
  }
});

document.getElementById("create-room-button").addEventListener("click", () => {
  const roomName = document.getElementById("room-input").value.trim();
  if (roomName !== "") {
    console.log("Creating room:", roomName);
    ws.send(JSON.stringify({ type: "createRoom", room: roomName }));
    currentRoom = roomName;
    toggleRoomButtons();
  }
});

document.getElementById("join-room-button").addEventListener("click", () => {
  const roomName = document.getElementById("room-input").value.trim();
  if (roomName !== "") {
    console.log("Joining room:", roomName);
    ws.send(JSON.stringify({ type: "joinRoom", room: roomName }));
    currentRoom = roomName;
    toggleRoomButtons();
  }
});

document.getElementById("leave-room-button").addEventListener("click", () => {
  console.log("Leaving room");
  ws.send(JSON.stringify({ type: "leaveRoom" }));
  currentRoom = null;
  toggleRoomButtons();
});

document.getElementById("leave-group-button").addEventListener("click", () => {
  console.log("Leaving group");
  ws.send(JSON.stringify({ type: "leaveGroup" }));
  currentRoom = null;
  toggleRoomButtons();
});

document.getElementById("send-button").addEventListener("click", () => {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message !== "") {
    sendMessage(message);
    messageInput.value = "";
  }
});

document.getElementById("send-image-button").addEventListener("click", () => {
  const fileInput = document.getElementById("image-input");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const imageData = event.target.result;
      console.log("Sending image");
      ws.send(
        JSON.stringify({ type: "image", sender: "Client 2", image: imageData })
      );
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("send-file-button").addEventListener("click", () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileData = event.target.result;
      console.log("Sending file");
      ws.send(
        JSON.stringify({
          type: "file",
          sender: "Client 2",
          file: fileData,
          fileName: file.name,
        })
      );
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("send-video-button").addEventListener("click", () => {
  const fileInput = document.getElementById("video-input");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const videoData = event.target.result;
      console.log("Sending video");
      ws.send(
        JSON.stringify({ type: "video", sender: "Client 2", video: videoData })
      );
    };
    reader.readAsDataURL(file);
  }
});

function toggleRoomButtons() {
  const createRoomButton = document.getElementById("create-room-button");
  const joinRoomButton = document.getElementById("join-room-button");
  const leaveRoomButton = document.getElementById("leave-room-button");
  const leaveGroupButton = document.getElementById("leave-group-button");

  if (currentRoom) {
    createRoomButton.style.display = "none";
    joinRoomButton.style.display = "none";
    leaveRoomButton.style.display = "block";
    leaveGroupButton.style.display = "block";
  } else {
    createRoomButton.style.display = "block";
    joinRoomButton.style.display = "block";
    leaveRoomButton.style.display = "none";
    leaveGroupButton.style.display = "none";
  }
}

