const ws = new WebSocket('ws://localhost:8080');
let currentRoom = null;
let peerConnections = {};
let dataChannels = {};
let currentPeerId = null;
const encryptionKey = 'your-encryption-key'; 
let isConnecting = false;
const clientName = 'Client 1';

function encryptMessage(message) {
    
    return message; 
}

function decryptMessage(message) {
    
    return message; 
}

function sendMessage(message) {
    const encryptedMessage = encryptMessage(message);
    ws.send(JSON.stringify({ type: 'message', message: encryptedMessage, room: currentRoom }));
    appendMessage('You', message);
}

document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message !== '') {
        sendMessage(message);
        messageInput.value = '';
    }
});

document.getElementById('send-private-message-button').addEventListener('click', sendPrivateMessage);


document.getElementById('private-message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendPrivateMessage();
    }
});


document.getElementById('send-image-button').addEventListener('click', () => {
    const fileInput = document.getElementById('image-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const imageData = event.target.result;
            ws.send(JSON.stringify({
                type: 'image',
                sender: 'Client 2',
                image: imageData,
                room: currentRoom
            }));
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('send-file-button').addEventListener('click', () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = event.target.result;
            ws.send(JSON.stringify({
                type: 'file',
                sender: 'Client 2',
                file: fileData,
                fileName: file.name,
                room: currentRoom
            }));
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('send-video-button').addEventListener('click', () => {
    const fileInput = document.getElementById('video-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const videoData = event.target.result;
            ws.send(JSON.stringify({
                type: 'video',
                sender: 'Client 2',
                video: videoData,
                room: currentRoom
            }));
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('create-room-button').addEventListener('click', () => {
    const room = prompt('Enter room name:');
    if (room) {
        ws.send(JSON.stringify({ type: 'createRoom', room: room }));
        currentRoom = room;
        updateRoomInfo();
        toggleRoomButtons();
    }
});

document.getElementById('join-room-button').addEventListener('click', () => {
    const room = prompt('Enter room name:');
    if (room) {
        ws.send(JSON.stringify({ type: 'joinRoom', room: room }));
        currentRoom = room;
        updateRoomInfo();
        toggleRoomButtons();
    }
});

document.getElementById('leave-room-button').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'leaveRoom', room: currentRoom }));
    currentRoom = null;
    updateRoomInfo();
    toggleRoomButtons();
});

document.getElementById('close-private-chat').addEventListener('click', () => {
    document.getElementById('private-chat-box').style.display = 'none';
    currentPrivateChatPeer = null;
});

ws.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data);
        const chatBox = document.getElementById('chat-box');
        if (data.type === 'image') {
            const imageElement = document.createElement('img');
            imageElement.src = data.image;
            chatBox.appendChild(imageElement);
        } else if (data.type === 'file') {
            const fileElement = document.createElement('a');
            fileElement.href = data.file;
            fileElement.setAttribute('download', data.fileName);
            fileElement.textContent = `${data.sender}: ${data.fileName}`;
            chatBox.appendChild(fileElement);
        } else if (data.type === 'video') {
            const videoElement = document.createElement('video');
            videoElement.src = data.video;
            videoElement.controls = true;
            chatBox.appendChild(videoElement);
        } else if (data.type === 'message') {
            const decryptedMessage = decryptMessage(data.message);
            appendMessage(data.sender, decryptedMessage);
        } else if (data.type === 'offer') {
            console.log('Received offer from', data.peerId);
            const peerConnection = peerConnections[data.peerId] || createPeerConnection(data.peerId);

            if (peerConnection.signalingState !== 'stable') {
                // Collision detected, rollback and accept the incoming offer
                peerConnection.setLocalDescription({ type: 'rollback' })
                    .then(() => {
                        console.log('Rolled back local description due to collision');
                        handleOffer(data.offer, data.peerId);
                    })
                    .catch(error => console.error('Error during rollback:', error));
            } else {
                handleOffer(data.offer, data.peerId);
            }
        }
        else if (data.type === 'answer') {
            console.log('Received answer from', data.peerId);
            const peerConnection = peerConnections[data.peerId];
            if (peerConnection.signalingState === 'have-local-offer') {
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
                    .then(() => {
                        console.log('Remote description set successfully');
                        isConnecting = false;
                    })
                    .catch(error => {
                        console.error('Error setting remote description:', error);
                        isConnecting = false;
                    });
            } else {
                console.warn('Unexpected signaling state:', peerConnection.signalingState);
            }
        } else if (data.type === 'ice-candidate') {
            console.log('Received ICE candidate from', data.peerId);
            const peerConnection = peerConnections[data.peerId];
            if (peerConnection) {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                    .catch(error => console.error('Error adding ICE candidate:', error));
            }
        } else if (data.type === 'roomInfo') {
            updateRoomInfo(data.room, data.participants);
            updateSidebar(data.participants);
        }
        function handleOffer(offer, peerId) {
            const peerConnection = peerConnections[peerId];
            peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                .then(() => {
                    console.log('Creating answer...');
                    return peerConnection.createAnswer();
                })
                .then(answer => {
                    console.log('Setting local description...');
                    return peerConnection.setLocalDescription(answer);
                })
                .then(() => {
                    console.log('Sending answer...');
                    ws.send(JSON.stringify({
                        type: 'answer',
                        answer: peerConnection.localDescription,
                        peerId: peerId
                    }));
                })
                .catch(error => console.error('Error handling offer:', error));
        }
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
});

function toggleRoomButtons() {
    const createRoomButton = document.getElementById('create-room-button');
    const joinRoomButton = document.getElementById('join-room-button');
    const leaveRoomButton = document.getElementById('leave-room-button');
    const leaveGroupButton = document.getElementById('leave-group-button');

    if (currentRoom) {
        createRoomButton.style.display = 'none';
        joinRoomButton.style.display = 'none';
        leaveRoomButton.style.display = 'block';
        leaveGroupButton.style.display = 'block';
    } else {
        createRoomButton.style.display = 'block';
        joinRoomButton.style.display = 'block';
        leaveRoomButton.style.display = 'none';
        leaveGroupButton.style.display = 'none';
    }
}

function updateRoomInfo(room = currentRoom, participants = []) {
    const chatInfo = document.querySelector('.chat-info');
    const participantCount = document.querySelector('.participant-count');
    if (room) {
        chatInfo.style.display = 'block';
        chatInfo.querySelector('h3').textContent = `Room: ${room}`;
        participantCount.textContent = `${participants.length} participants`;
    } else {
        chatInfo.style.display = 'none';
    }
}

function updateSidebar(participants) {
    const sidebarChats = document.querySelector('.sidebar-chats');
    sidebarChats.innerHTML = '';
    participants.forEach(participant => {
        const participantElement = document.createElement('div');
        participantElement.classList.add('sidebar-chat');
        participantElement.textContent = participant;
        participantElement.addEventListener('click', () => initiateDirectMessage(participant));
        sidebarChats.appendChild(participantElement);
    });
}

function initiateDirectMessage(peerId) {
    console.log('Initiating direct message with', peerId);
    currentPrivateChatPeer = peerId;

    document.getElementById('private-chat-title').textContent = `Chat with ${peerId.substring(0, 8)}...`;
    document.getElementById('private-chat-box').style.display = 'block';
    document.getElementById('private-message-content').innerHTML = '';

    if (!peerConnections[peerId] && !isConnecting) {
        isConnecting = true;
        const peerConnection = createPeerConnection(peerId);

        try {
            const dataChannel = peerConnection.createDataChannel('chat', {
                ordered: true,
                reliable: true
            });

            setupDataChannel(dataChannel, peerId);

            console.log('Creating offer...');
            peerConnection.createOffer({
                offerToReceiveAudio: false,
                offerToReceiveVideo: false
            })
                .then(offer => {
                    console.log('Setting local description...');
                    return peerConnection.setLocalDescription(offer);
                })
                .then(() => {
                    console.log('Sending offer...');
                    ws.send(JSON.stringify({
                        type: 'offer',
                        offer: peerConnection.localDescription,
                        peerId: peerId
                    }));
                })
                .catch(error => {
                    console.error('Error creating offer:', error);
                    isConnecting = false;
                });
        } catch (error) {
            console.error('Error setting up peer connection:', error);
            isConnecting = false;
        }
    }
}

function setupDataChannel(dataChannel, peerId) {
    dataChannel.onopen = () => {
        console.log('Data channel open with', peerId);
        dataChannels[peerId] = dataChannel;
        isConnecting = false;
    };

    dataChannel.onclose = () => {
        console.log('Data channel closed with', peerId);
        delete dataChannels[peerId];
    };

    dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
    };

    dataChannel.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const decryptedMessage = decryptMessage(data.message);
            appendPrivateMessage(data.sender, decryptedMessage, 'received');
        } catch (error) {
            console.error('Error handling message:', error);
        }
    };
}

function sendPrivateMessage() {
    const messageInput = document.getElementById('private-message-input');
    const message = messageInput.value.trim();

    if (message && currentPrivateChatPeer && dataChannels[currentPrivateChatPeer]) {
        const encryptedMessage = encryptMessage(message);
        dataChannels[currentPrivateChatPeer].send(JSON.stringify({
            type: 'message',
            message: encryptedMessage,
            sender: clientName 
        }));
        
        appendPrivateMessage('You', message, 'sent');
        messageInput.value = '';
    }
}



function createPeerConnection(peerId) {
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }
        ],
        iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[peerId] = peerConnection;

    peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state for ${peerId}:`, peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
            console.log('Attempting to reconnect...');
            restartIce(peerId);
        }
    };

    peerConnection.onsignalingstatechange = () => {
        console.log(`Signaling state for ${peerId}:`, peerConnection.signalingState);
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${peerId}:`, peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            peerConnection.restartIce();
        }
    };

    // Improved ICE candidate handling
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate to', peerId);
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate,
                peerId: peerId
            }));
        }
    };

    peerConnection.onicegatheringstatechange = () => {
        console.log(`ICE gathering state: ${peerConnection.iceGatheringState}`);
    };

    peerConnection.ondatachannel = (event) => {
        console.log('Received data channel');
        setupDataChannel(event.channel, peerId);
    };

    return peerConnection;
}

// Add reconnection logic
function restartIce(peerId) {
    const peerConnection = peerConnections[peerId];
    if (peerConnection) {
        peerConnection.createOffer({ iceRestart: true })
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                ws.send(JSON.stringify({
                    type: 'offer',
                    offer: peerConnection.localDescription,
                    peerId: peerId
                }));
            })
            .catch(error => console.error('Error restarting ICE:', error));
    }
}


function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; 
}

function appendPrivateMessage(sender, message, type = 'sent') {
    const privateChatBox = document.getElementById('private-message-content');
    const messageElement = document.createElement('div');
    messageElement.classList.add('private-message', type);
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    privateChatBox.appendChild(messageElement);
    privateChatBox.scrollTop = privateChatBox.scrollHeight;
}