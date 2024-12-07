const WebSocket = require("ws");
const fs = require("fs");

const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });

// Object to store clients and their associated rooms
const clients = new Map();
const groups = new Map();

// Generate a random client ID
function generateClientId() {
  return Math.random().toString(36).substring(7);
}

wss.on("connection", (ws) => {
  const clientId = generateClientId();
  clients.set(clientId, ws);
  ws.clientId = clientId;

  console.log(`Client ${clientId} connected`);

  ws.send(JSON.stringify({
    type: "init",
    clientId: clientId
  }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Message received:", data);

    if (data.type === "createRoom" || data.type === "joinRoom") {
      const room = data.room;
      if (!groups.has(room)) {
        groups.set(room, new Set());
      }
      groups.get(room).add(ws);
      clients.set(ws, room);
      
      // Notify all clients in the room
      groups.get(room).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "roomUpdate",
            message: `${data.type === "createRoom" ? "Room created" : "User joined"}: ${room}`,
            room: room
          }));
        }
      });
      
      console.log(`User ${data.type === "createRoom" ? "created" : "joined"} room: ${room}`);
    } else if (data.type === "message") {
      // Handle regular messages
      const room = clients.get(ws);
      if (room && groups.has(room)) {
        groups.get(room).forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "message",
              sender: ws.clientId,
              message: data.message,
              room: room
            }));
          }
        });
      }
    } else if (data.type === "personalMessage") {
      const recipientId = data.recipientId;
      const recipientWs = clients.get(recipientId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({
          type: "personalMessage",
          sender: ws.clientId,
          message: data.message
        }));
        console.log("Personal message sent to recipient");
      } else {
        console.log("Recipient not found or not connected");
      }
    } else if (data.type === "leaveRoom") {
      const room = clients.get(ws);
      if (room && groups.has(room)) {
        groups.get(room).delete(ws);
        if (groups.get(room).size === 0) {
          groups.delete(room);
        }
        clients.delete(ws);
        console.log("User left the room");
      }
    } else if (data.type === "leaveGroup") {
      const room = clients.get(ws);
      if (room && groups.has(room)) {
        groups.get(room).forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                sender: "System",
                message: "Group has been disbanded.",
              })
            );
          }
          clients.delete(client);
        });
        groups.delete(room);
        console.log("Group disbanded");
      }
    } else if (data.type === "image") {
      // Broadcast the image to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              sender: data.sender,
              image: data.image,
              type: "image",
            })
          );
        }
      });
    } else if (data.type === "file") {
      // Broadcast the file to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              sender: data.sender,
              file: data.file,
              fileName: data.fileName,
              type: "file",
            })
          );
        }
      });
    } else if (data.type === "video") {
      // Broadcast the video to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              sender: data.sender,
              video: data.video,
              type: "video",
            })
          );
        }
      });
    } else if (data.type === "broadcast") {
      // Broadcast the message to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              sender: data.sender,
              message: data.message,
              type: "broadcast",
            })
          );
        }
      });
    } else {
      // Broadcast the received message to all clients in the same room
      const currentRoom = clients.get(ws);
      if (currentRoom && groups.has(currentRoom)) {
        groups.get(currentRoom).forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ sender: currentRoom, message: data.message })
            );
          }
        });
      }
    }
  });

  ws.on("close", () => {
    console.log("A user disconnected");
    const room = clients.get(ws);
    if (room && groups.has(room)) {
      groups.get(room).delete(ws);
      if (groups.get(room).size === 0) {
        groups.delete(room);
      }
      clients.delete(ws);
    }
  });
});

console.log(`Server is listening on port ${PORT}`);
