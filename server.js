const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 1e7,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const rooms = new Map();
const userColors = new Map();
const activeCalls = new Map();
const MAX_ROOMS = 5;

const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f'];

function getUserColor(username) {
  if (!userColors.has(username)) {
    const colorIndex = userColors.size % colors.length;
    userColors.set(username, colors[colorIndex]);
  }
  return userColors.get(username);
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ roomName, password }) => {
    if (rooms.size >= MAX_ROOMS) {
      socket.emit('room-error', 'Maximum number of rooms reached');
      return;
    }
    if (rooms.has(roomName)) {
      socket.emit('room-error', 'Room already exists');
      return;
    }
    rooms.set(roomName, { password, users: [] });
    socket.emit('room-created', roomName);
  });

  socket.on('join-room', ({ roomName, password, username }) => {
    const room = rooms.get(roomName);
    if (!room) {
      socket.emit('join-error', 'Room not found');
      return;
    }
    if (room.password !== password) {
      socket.emit('join-error', 'Incorrect password');
      return;
    }
    
    socket.join(roomName);
    socket.username = username;
    socket.roomName = roomName;
    socket.userColor = getUserColor(username);
    room.users.push({ username, color: socket.userColor });
    
    socket.emit('join-success', { roomName, userColor: socket.userColor });
    socket.to(roomName).emit('user-joined', username);
    io.to(roomName).emit('user-list', room.users);
  });

  socket.on('send-message', ({ message, type, imageData }) => {
    if (socket.roomName) {
      const messageData = {
        username: socket.username,
        userColor: socket.userColor,
        timestamp: new Date().toLocaleTimeString(),
        type: type || 'text'
      };
      
      if (type === 'image') {
        messageData.imageData = imageData;
      } else {
        messageData.message = message;
      }
      
      io.to(socket.roomName).emit('new-message', messageData);
    }
  });

  socket.on('start-call', ({ isVideo = false }) => {
    if (socket.roomName) {
      const room = rooms.get(socket.roomName);
      if (room) {
        activeCalls.set(socket.roomName, {
          starter: socket.username,
          starterId: socket.id,
          isVideo: isVideo,
          participants: [{ username: socket.username, id: socket.id }]
        });
        
        const callMessage = {
          type: 'group-call',
          callType: isVideo ? 'video' : 'voice',
          starter: socket.username,
          timestamp: new Date().toLocaleTimeString(),
          isActive: true
        };
        io.to(socket.roomName).emit('new-message', callMessage);
        
        socket.emit('call-started', { isVideo });
      }
    }
  });

  socket.on('join-call', ({ isVideo = false }) => {
    if (socket.roomName) {
      const activeCall = activeCalls.get(socket.roomName);
      if (activeCall) {
        activeCall.participants.push({ username: socket.username, id: socket.id });
        
        activeCall.participants.forEach(participant => {
          if (participant.id !== socket.id) {
            io.to(participant.id).emit('user-joined-call', {
              username: socket.username,
              userId: socket.id
            });
          }
        });
        
        socket.emit('call-participants', {
          participants: activeCall.participants.filter(p => p.id !== socket.id),
          isVideo: activeCall.isVideo
        });
        
        socket.emit('joined-call', { isVideo: activeCall.isVideo });
      }
    }
  });

  socket.on('webrtc-offer', ({ offer, targetId }) => {
    io.to(targetId).emit('webrtc-offer', { offer, senderId: socket.id });
  });

  socket.on('webrtc-answer', ({ answer, targetId }) => {
    io.to(targetId).emit('webrtc-answer', { answer, senderId: socket.id });
  });

  socket.on('webrtc-ice-candidate', ({ candidate, targetId }) => {
    io.to(targetId).emit('webrtc-ice-candidate', { candidate, senderId: socket.id });
  });

  socket.on('end-call', () => {
    if (socket.roomName) {
      const activeCall = activeCalls.get(socket.roomName);
      if (activeCall) {
        activeCall.participants = activeCall.participants.filter(p => p.id !== socket.id);
        
        if (activeCall.participants.length === 0) {
          activeCalls.delete(socket.roomName);
          socket.to(socket.roomName).emit('call-ended', socket.username);
        } else {
          activeCall.participants.forEach(participant => {
            io.to(participant.id).emit('user-left-call', socket.username);
          });
        }
      }
    }
  });

  socket.on('get-rooms', () => {
    socket.emit('rooms-list', Array.from(rooms.keys()));
  });

  socket.on('disconnect', () => {
    if (socket.roomName && socket.username) {
      const room = rooms.get(socket.roomName);
      if (room) {
        room.users = room.users.filter(user => user.username !== socket.username);
        socket.to(socket.roomName).emit('user-left', socket.username);
        io.to(socket.roomName).emit('user-list', room.users);
        
        if (room.users.length === 0) {
          rooms.delete(socket.roomName);
        }
      }
      
      const activeCall = activeCalls.get(socket.roomName);
      if (activeCall) {
        activeCall.participants = activeCall.participants.filter(p => p.id !== socket.id);
        if (activeCall.participants.length === 0) {
          activeCalls.delete(socket.roomName);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
