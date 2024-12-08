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
    try {
      const data = JSON.parse(message);
      console.log("Server received message type:", data.type);

      if (data.type === "file") {
        const room = data.room;
        if (room && groups.has(room)) {
          console.log(`Broadcasting file ${data.fileName} to room ${room}`);
          
          // Store file message in chat history
          groups.get(room).messages.push({
            type: "file",
            sender: ws.clientId,
            file: data.file,
            fileName: data.fileName,
            room: room
          });

          // Broadcast to other clients in room
          groups.get(room).clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "file",
                sender: ws.clientId,
                file: data.file,
                fileName: data.fileName,
                room: room
              }));
            }
          });
        }
      }

      if (data.type === "createRoom" || data.type === "joinRoom") {
        const room = data.room;
        if (!groups.has(room)) {
          groups.set(room, { clients: new Set(), messages: [] });
        }
        groups.get(room).clients.add(ws);
        ws.currentRoom = room;

        // Send chat history to the newly joined client
        ws.send(JSON.stringify({
          type: "chatHistory",
          room: room,
          messages: groups.get(room).messages
        }));

        // Notify all clients in the room about the updated participant count
        const participantCount = groups.get(room).clients.size;
        groups.get(room).clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "participantCount",
              room: room,
              count: participantCount
            }));
          }
        });

        console.log(`Client ${ws.clientId} joined room: ${room}`);
      } else if (data.type === "message") {
        const room = ws.currentRoom;
        if (room && groups.has(room)) {
          const messageData = {
            type: data.type,
            sender: ws.clientId,
            message: data.message,
            room: room,
          };
          // Store the message in chat history
          groups.get(room).messages.push(messageData);

          // Broadcast the message to other clients
          groups.get(room).clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageData));
            }
          });
        }
      } else if (data.type === "leaveRoom") {
        const room = ws.currentRoom;
        if (room && groups.has(room)) {
          groups.get(room).clients.delete(ws);
          ws.currentRoom = null;

          // Notify remaining clients about the updated participant count
          const participantCount = groups.get(room).clients.size;
          groups.get(room).clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "participantCount",
                room: room,
                count: participantCount
              }));
            }
          });

          if (participantCount === 0) {
            groups.delete(room);
          }

          console.log(`Client ${ws.clientId} left room: ${room}`);
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
      } else if (data.type === "leaveGroup") {
        // Corrected room retrieval and client removal
        const room = ws.currentRoom;
        if (room && groups.has(room)) {
          groups.get(room).forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  sender: "System",
                  message: `Group ${room} has been disbanded.`,
                  type: "system",
                })
              );
            }
            client.currentRoom = null;
          });
          groups.delete(room);
          ws.currentRoom = null;
          console.log("Group disbanded");
        }
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
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("A user disconnected");
    const room = ws.currentRoom;
    if (room && groups.has(room)) {
      groups.get(room).clients.delete(ws);

      // Notify remaining clients about the updated participant count
      const participantCount = groups.get(room).clients.size;
      groups.get(room).clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "participantCount",
            room: room,
            count: participantCount
          }));
        }
      });

      if (participantCount === 0) {
        groups.delete(room);
      }
    }
    clients.delete(ws.clientId);
    console.log(`Client ${ws.clientId} disconnected`);
  });
});

console.log(`Server is listening on port ${PORT}`);
