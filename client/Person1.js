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
  try {
    const data = JSON.parse(event.data);
    console.log("Received message type:", data.type);

    if (data.type === "file" && data.room === currentRoom) {
      console.log("Received file:", data.fileName);
      appendFileMessage(data.sender, data.file, data.fileName);
    }
    // ...existing code...
    console.log("Message received:", data);

    if (data.type === "init") {
      clientId = data.clientId;
      console.log("Initialized with client ID:", clientId);
    } else if (data.type === "chatHistory") {
      currentRoom = data.room;
      toggleRoomButtons();
      document.querySelector('.chat-info h3').textContent = `Room: ${currentRoom}`;
      addSystemMessage(`Joined room "${currentRoom}" successfully`);

      // Display chat history
      data.messages.forEach((messageData) => {
        if (messageData.type === "message") {
          appendMessage(messageData.sender, messageData.message);
        } else if (messageData.type === "file") {
          appendFileMessage(messageData.sender, messageData.file, messageData.fileName);
        }
      });
    } else if (data.type === "participantCount" && data.room === currentRoom) {
      // Update participant count display
      document.querySelector('.participant-count').textContent = `${data.count} participants`;
    } else if (data.type === "file" && data.room === currentRoom) {
      appendFileMessage(data.sender, data.file, data.fileName);
    } else if (data.type === "message" && data.room === currentRoom) {
      appendMessage(data.sender, data.message);
    } else if (data.type === "system") {
      addSystemMessage(data.message);
    } else {
      appendMessage(data.sender, data.message);
    }
  } catch (error) {
    console.error("Error processing message:", error);
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

document.getElementById("send-file-button").addEventListener("click", () => {
  const fileInput = document.getElementById("file-input");
  fileInput.click();
});

document.getElementById("file-input").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    sendFile(file);
  }
});

function sendFile(file) {
  if (!currentRoom) {
    alert("Please join a room before sending files");
    return;
  }

  console.log("Sending file:", file.name);

  const maxSize = 5 * 1024 * 1024; // 5MB limit
  if (file.size > maxSize) {
    alert("File is too large. Maximum size is 5MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const fileData = event.target.result;
      console.log("File read successfully, sending to server...");

      const messageData = {
        type: "file",
        sender: clientId,
        file: fileData,
        fileName: file.name,
        room: currentRoom
      };

      ws.send(JSON.stringify(messageData));
      appendFileMessage("You", fileData, file.name);
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Failed to send file. Please try again.");
    }
  };

  reader.onerror = function(error) {
    console.error("Error reading file:", error);
    alert("Failed to read file. Please try again.");
  };

  reader.readAsDataURL(file);
}

function toggleRoomButtons() {
  if (currentRoom) {
    createRoomButton.style.display = "none";
    joinRoomButton.style.display = "none";
    leaveRoomButton.style.display = "block";
  } else {
    createRoomButton.style.display = "block";
    joinRoomButton.style.display = "block";
    leaveRoomButton.style.display = "none";
    // Clear participant count when not in a room
    document.querySelector('.participant-count').textContent = `0 participants`;
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
    // Reset participant count display
    document.querySelector('.participant-count').textContent = `0 participants`;
  }
}

function appendFileMessage(sender, fileData, fileName) {
  console.log("Appending file message:", fileName);
  
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender === "You" ? "message-sent" : "message-received"}`;

  // Create message container
  const messageContainer = document.createElement("div");
  messageContainer.className = "file-message-container";

  // Add sender name
  const senderText = document.createElement("div");
  senderText.className = "message-sender";
  senderText.textContent = sender;
  messageContainer.appendChild(senderText);

  // Add file icon and name
  const fileInfo = document.createElement("div");
  fileInfo.className = "file-info";
  fileInfo.innerHTML = `📎 ${fileName}`;
  messageContainer.appendChild(fileInfo);

  // Add download button
  const downloadButton = document.createElement("button");
  downloadButton.className = "download-button";
  downloadButton.innerHTML = "Download";
  downloadButton.onclick = () => {
    const link = document.createElement("a");
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  messageContainer.appendChild(downloadButton);

  messageDiv.appendChild(messageContainer);
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message system-message';
  messageElement.textContent = message;
  document.getElementById('chat-box').appendChild(messageElement);
}