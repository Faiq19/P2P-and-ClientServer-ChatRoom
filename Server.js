const WebSocket = require('ws');
const crypto = require('crypto');
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();
const groups = new Map();

wss.on('connection', (ws) => {
    const clientId = crypto.randomBytes(16).toString('hex');
    clients.set(ws, { clientId, room: null });

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'createRoom') {
            const room = data.room;
            clients.get(ws).room = room;
            if (!groups.has(room)) {
                groups.set(room, new Set());
            }
            groups.get(room).add(ws);
            console.log(`User created room: ${room}`);
            broadcastRoomInfo(room);
        } else if (data.type === 'joinRoom') {
            const room = data.room;
            clients.get(ws).room = room;
            if (!groups.has(room)) {
                groups.set(room, new Set());
            }
            groups.get(room).add(ws);
            console.log(`User joined room: ${room}`);
            broadcastRoomInfo(room);
        } else if (data.type === 'leaveRoom') {
            const room = clients.get(ws).room;
            if (room && groups.has(room)) {
                groups.get(room).delete(ws);
                if (groups.get(room).size === 0) {
                    groups.delete(room);
                }
                clients.get(ws).room = null;
                console.log(`User left room: ${room}`);
                broadcastRoomInfo(room);
            }
        } else if (data.type === 'message' || data.type === 'image' || data.type === 'file' || data.type === 'video') {
            const room = clients.get(ws).room;
            if (room && groups.has(room)) {
                const senderId = clients.get(ws).clientId;
                groups.get(room).forEach(client => {
                    if (client !== ws) {
                        client.send(JSON.stringify({ ...data, sender: senderId }));
                    }
                });
            }
        } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice-candidate') {
            const targetClient = Array.from(clients.keys()).find(client => clients.get(client).clientId === data.peerId);
            if (targetClient) {
                targetClient.send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        console.log('A user disconnected');
        const room = clients.get(ws).room;
        if (room && groups.has(room)) {
            groups.get(room).delete(ws);
            if (groups.get(room).size === 0) {
                groups.delete(room);
            }
            broadcastRoomInfo(room);
        }
        clients.delete(ws);
    });
});

function broadcastRoomInfo(room) {
    if (groups.has(room)) {
        groups.get(room).forEach(client => {
            const participants = Array.from(groups.get(room))
                .map(ws => clients.get(ws).clientId);
            client.send(JSON.stringify({ type: 'roomInfo', room: room, participants: participants }));
        });
    }
}

console.log(`Server is listening on port ${PORT}`);