# Wave Chat - P2P and Client-Server ChatRoom

A modern, real-time chat application that combines both client-server and peer-to-peer (P2P) communication architectures. Wave Chat enables users to create chat rooms, exchange messages, share media files, and engage in private P2P conversations.

## ✨ Features

- **Room-Based Chat**: Create or join chat rooms for group conversations
- **Real-Time Messaging**: Instant message delivery using WebSocket technology
- **P2P Private Chat**: Direct peer-to-peer communication using WebRTC
- **Media Sharing**: Support for images, videos, and document files
- **Modern UI**: Clean and responsive interface with custom styling
- **Multiple Participants**: See all participants in the current room
- **Connection Management**: Automatic ICE restart and reconnection handling

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **WebSocket (ws)** - Real-time bidirectional communication
- **Crypto** - Cryptographic functionality for secure client IDs

### Frontend
- **HTML5** - Markup structure
- **CSS3** - Modern styling with custom properties and grid layout
- **Vanilla JavaScript** - Client-side logic and interactivity
- **WebRTC** - Peer-to-peer data channels for private messaging

### Additional Technologies
- **STUN/TURN Servers** - NAT traversal for WebRTC connections
- **Google Fonts (Poppins)** - Typography

## 📋 Prerequisites

Before running this application, ensure you have the following installed:
- **Node.js** (v12 or higher)
- **npm** (Node Package Manager)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/Faiq19/P2P-and-ClientServer-ChatRoom.git
cd P2P-and-ClientServer-ChatRoom
```

2. Install dependencies:
```bash
npm install
```

## 💻 Usage

### Starting the Server

Run the WebSocket server:
```bash
node Server.js
```

The server will start on port 8080 (or the port specified in the PORT environment variable).

### Accessing the Client

1. Open the `client/Person1.html` file in a web browser
2. You can open multiple browser tabs/windows to simulate multiple users

### Creating or Joining a Room

1. Click the **"Create Room"** button and enter a room name
2. Or click **"Join Room"** to join an existing room
3. Start chatting with other participants in the room

### Sending Messages

- **Text Messages**: Type in the message input and click "Send" or press Enter
- **Images**: Click the gallery icon and select an image file
- **Documents**: Click the clip icon and select a PDF, DOC, or TXT file
- **Videos**: Click the video icon and select a video file

### Private P2P Chat

1. Click on a participant's ID in the sidebar
2. A private chat window will open
3. Messages in this window are sent directly peer-to-peer using WebRTC

## 📁 Project Structure

```
P2P-and-ClientServer-ChatRoom/
├── Server.js              # WebSocket server implementation
├── client/
│   ├── Person1.html       # Main client interface
│   ├── Person1.js         # Client-side JavaScript logic
│   ├── Styling1.css       # Application styles
│   ├── favicon.svg        # Application icon
│   ├── gallery.png        # Image upload icon
│   ├── clip.png           # File upload icon
│   └── video.png          # Video upload icon
├── package.json           # Project dependencies
├── package-lock.json      # Dependency lock file
└── .gitignore            # Git ignore rules
```

## 🔧 Configuration

### Server Port
The server port can be configured using the `PORT` environment variable:
```bash
PORT=3000 node Server.js
```

### WebSocket Connection
Update the WebSocket URL in `client/Person1.js` if using a different server address:
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

## 🔐 Security Features

- Unique client IDs generated using cryptographic functions
- Secure P2P communication via WebRTC data channels
- Architecture supports future implementation of message encryption

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve the application.

## 📄 License

This project is open source and available for educational and personal use.

## 👨‍💻 Author

Created by [Faiq19](https://github.com/Faiq19)

---

**Note**: For production deployment, ensure proper security measures including SSL/TLS encryption, authentication, and environment-specific configurations.
