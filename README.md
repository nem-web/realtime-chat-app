# Modern Real-Time Chat Application

A sleek, modern real-time chat application with room-based messaging, password protection, and a beautiful UI.

## Features

- **Room Management**: Create up to 5 chat rooms with custom names and passwords
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Authentication**: Password-protected rooms with username-based access
- **Modern UI**: Sleek, responsive design with gradient backgrounds and smooth animations
- **User Presence**: See who's online in each room
- **Room Limits**: Automatic cleanup when rooms are empty

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## How to Use

### Creating a Room
1. Click "Create Room" on the home screen
2. Enter a room name (max 20 characters)
3. Set a password for the room
4. Click "Create" to establish the room

### Joining a Room
1. Click "Join Room" on the home screen
2. Enter your username (max 15 characters)
3. Select an available room from the dropdown
4. Enter the correct room password
5. Click "Join" to enter the chat

### Chatting
- Type messages in the input field (max 200 characters)
- Press Enter or click "Send" to send messages
- See real-time messages from all users in the room
- View the list of online users in the sidebar
- Click "Leave" to exit the room

## Technical Details

- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla JavaScript with modern CSS
- **Real-time Communication**: WebSocket connections via Socket.IO
- **Room Limit**: Maximum 5 concurrent rooms
- **Auto-cleanup**: Empty rooms are automatically deleted

## Development

For development with auto-restart:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`
