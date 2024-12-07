const ws = new WebSocket("ws://localhost:3000");
let currentRoom = null;
let clientId = null;

// Get references to buttons
const createRoomButton = document.getElementById('create-room-button');
const joinRoomButton = document.getElementById('join-room-button');
const leaveRoomButton = document.getElementById('leave-room-button');

// Add event listeners to buttons
createRoomButton.addEventListener('click', () => {
  const roomName = prompt('Enter room name:');
  createRoom(roomName);
});

joinRoomButton.addEventListener('click', () => {
  const roomName = prompt('Enter room name to join:');
  joinRoom(roomName);
});

leaveRoomButton.addEventListener('click', leaveRoom);

ws.addEventListener("open", () => {
  console.log("Connected to server");
});

function appendMessage(sender, message) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  chatBox.appendChild(messageElement);
}

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log("Message received:", data);

  if (data.type === "init") {
    clientId = data.clientId;
    console.log("Initialized with client ID:", clientId);
  } else if (data.type === "roomJoined") {
    currentRoom = data.room;
    toggleRoomButtons();
    document.querySelector('.chat-info h3').textContent = `Room: ${currentRoom}`;
    addSystemMessage(`Joined room "${currentRoom}" successfully`);
  } else if (data.type === "roomUpdate") {
    appendMessage("System", data.message);
  } else if (data.room === currentRoom) {
    if (data.type === "message") {
      appendMessage(data.sender, data.message);
    } else if (data.type === "image") {
      appendImageMessage(data.sender, data.image);
    } else if (data.type === "file") {
      appendFileMessage(data.sender, data.file, data.fileName);
    } else if (data.type === "video") {
      appendVideoMessage(data.sender, data.video);
    }
  } else if (data.type === "system") {
    addSystemMessage(data.message);
  } else {
    appendMessage(data.sender, data.message);
  }
});

function sendMessage(message) {
  if (!message.trim() || !currentRoom) return;

  const messageData = {
    type: "message",
    message: message,
    sender: clientId,
    room: currentRoom
  };

  ws.send(JSON.stringify(messageData));
  appendMessage("You", message);
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

document.getElementById("create-room-button").addEventListener("click", () => {
  const roomInput = document.getElementById("room-input");
  const roomName = roomInput.value.trim();
  if (roomName) {
    console.log("Creating room:", roomName);
    ws.send(JSON.stringify({
      type: "createRoom",
      room: roomName
    }));
    currentRoom = roomName;
    toggleRoomButtons();
    roomInput.value = "";
  }
});

document.getElementById("join-room-button").addEventListener("click", () => {
  const roomInput = document.getElementById("room-input");
  const roomName = roomInput.value.trim();
  if (roomName) {
    console.log("Joining room:", roomName);
    ws.send(JSON.stringify({
      type: "joinRoom",
      room: roomName
    }));
    currentRoom = roomName;
    toggleRoomButtons();
    roomInput.value = "";
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

document.getElementById("send-image-button").addEventListener("click", () => {
  const fileInput = document.getElementById("image-input");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const imageData = event.target.result;
      console.log("Sending image");
      if (currentRoom) {
        ws.send(
          JSON.stringify({ type: "image", sender: clientId, image: imageData, room: currentRoom })
        );
      } else {
        ws.send(
          JSON.stringify({ type: "image", sender: clientId, image: imageData })
        );
      }
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
      if (currentRoom) {
        ws.send(
          JSON.stringify({
            type: "file",
            sender: clientId,
            file: fileData,
            fileName: file.name,
            room: currentRoom
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "file",
            sender: clientId,
            file: fileData,
            fileName: file.name
          })
        );
      }
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
      if (currentRoom) {
        ws.send(
          JSON.stringify({ type: "video", sender: clientId, video: videoData, room: currentRoom })
        );
      } else {
        ws.send(
          JSON.stringify({ type: "video", sender: clientId, video: videoData })
        );
      }
    };
    reader.readAsDataURL(file);
  }
});

function toggleRoomButtons() {
  if (currentRoom) {
    createRoomButton.style.display = "none";
    joinRoomButton.style.display = "none";
    leaveRoomButton.style.display = "block";
  } else {
    createRoomButton.style.display = "block";
    joinRoomButton.style.display = "block";
    leaveRoomButton.style.display = "none";
  }
}

function createRoom(roomName) {
  if (roomName) {
    ws.send(JSON.stringify({
      type: "createRoom",
      room: roomName
    }));
  }
}

function joinRoom(roomName) {
  if (roomName) {
    ws.send(JSON.stringify({
      type: "joinRoom",
      room: roomName
    }));
  }
}

function leaveRoom() {
  if (currentRoom) {
    ws.send(JSON.stringify({ type: "leaveRoom" }));
    currentRoom = null;
    toggleRoomButtons();
    document.querySelector('.chat-info h3').textContent = `Chat Room`;
    addSystemMessage(`Left the room`);
    document.getElementById('chat-box').innerHTML = '';
  }
}

function sendImage() {
  const fileInput = document.getElementById("image-input");
  const file = fileInput.files[0];
  if (file && currentRoom) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const imageData = event.target.result;
      ws.send(JSON.stringify({
        type: "image",
        sender: clientId,
        image: imageData,
        room: currentRoom
      }));
      appendImageMessage("You", imageData);
    };
    reader.readAsDataURL(file);
  }
}

function sendFile() {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (file && currentRoom) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileData = event.target.result;
      ws.send(JSON.stringify({
        type: "file",
        sender: clientId,
        file: fileData,
        fileName: file.name,
        room: currentRoom
      }));
      appendFileMessage("You", fileData, file.name);
    };
    reader.readAsDataURL(file);
  }
}

function sendVideo() {
  const fileInput = document.getElementById("video-input");
  const file = fileInput.files[0];
  if (file && currentRoom) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const videoData = event.target.result;
      ws.send(JSON.stringify({
        type: "video",
        sender: clientId,
        video: videoData,
        room: currentRoom
      }));
      appendVideoMessage("You", videoData);
    };
    reader.readAsDataURL(file);
  }
}

document.getElementById("image-input").addEventListener("change", sendImage);
document.getElementById("file-input").addEventListener("change", sendFile);
document.getElementById("video-input").addEventListener("change", sendVideo);

function appendImageMessage(sender, imageSrc) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.className = sender === "You" ? "message-sent" : "message-received";
  const img = document.createElement("img");
  img.src = imageSrc;
  img.style.maxWidth = "200px";
  messageElement.appendChild(img);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendFileMessage(sender, fileData, fileName) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.className = sender === "You" ? "message-sent" : "message-received";

  const link = document.createElement("a");
  link.href = fileData;
  link.download = fileName;
  link.style.display = "none"; // Hide the link

  // Create a download button with an icon
  const downloadButton = document.createElement("button");
  downloadButton.className = "download-button";
  downloadButton.innerHTML = `${sender}: ${fileName}`;
  downloadButton.onclick = () => {
    link.click();
  };

  messageElement.appendChild(downloadButton);
  messageElement.appendChild(link); // Append link to the message element

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendVideoMessage(sender, videoSrc) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.className = sender === "You" ? "message-sent" : "message-received";
  const video = document.createElement("video");
  video.src = videoSrc;
  video.controls = true;
  video.style.maxWidth = "200px";
  messageElement.appendChild(video);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.textContent = message;
    document.getElementById('chat-box').appendChild(messageElement);
}
