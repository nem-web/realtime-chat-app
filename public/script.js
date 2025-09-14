const socket = io();

// DOM elements
const screens = {
    home: document.getElementById('home-screen'),
    create: document.getElementById('create-room-screen'),
    join: document.getElementById('join-room-screen'),
    chat: document.getElementById('chat-screen')
};

const elements = {
    createRoomBtn: document.getElementById('create-room-btn'),
    joinRoomBtn: document.getElementById('join-room-btn'),
    backFromCreate: document.getElementById('back-from-create'),
    backFromJoin: document.getElementById('back-from-join'),
    createRoomSubmit: document.getElementById('create-room-submit'),
    joinRoomSubmit: document.getElementById('join-room-submit'),
    leaveRoom: document.getElementById('leave-room'),
    sendMessage: document.getElementById('send-message'),
    messageText: document.getElementById('message-text'),
    emojiBtn: document.getElementById('emoji-btn'),
    imageBtn: document.getElementById('image-btn'),
    callBtn: document.getElementById('call-btn'),
    imageInput: document.getElementById('image-input'),
    emojiPicker: document.getElementById('emoji-picker'),
    emojiGrid: document.getElementById('emoji-grid'),
    callModal: document.getElementById('call-modal'),
    incomingCallModal: document.getElementById('incoming-call-modal'),
    callerName: document.getElementById('caller-name'),
    acceptCallBtn: document.getElementById('accept-call-btn'),
    declineCallBtn: document.getElementById('decline-call-btn'),
    callStatus: document.getElementById('call-status'),
    callType: document.getElementById('call-type'),
    incomingCallType: document.getElementById('incoming-call-type'),
    videoCallBtn: document.getElementById('video-call-btn'),
    videoContainer: document.getElementById('video-container'),
    localVideo: document.getElementById('local-video'),
    remoteVideo: document.getElementById('remote-video'),
    videoToggleBtn: document.getElementById('video-toggle-btn'),
    muteBtn: document.getElementById('mute-btn'),
    endCallBtn: document.getElementById('end-call-btn'),
    roomsList: document.getElementById('rooms'),
    roomSelect: document.getElementById('room-select'),
    messages: document.getElementById('messages'),
    userList: document.getElementById('user-list'),
    roomTitle: document.getElementById('room-title'),
    notification: document.getElementById('notification')
};

let currentRoom = null;
let currentUserColor = '#667eea';
let isInCall = false;
let isMuted = false;
let isVideoCall = false;
let isVideoEnabled = true;
let currentCallerId = null;
let ringInterval = null;
let localStream = null;
let peerConnections = new Map();
let remoteStreams = new Map();

// Create ringing sound
function createRingingSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 500);
}

function startRinging() {
    createRingingSound();
    ringInterval = setInterval(createRingingSound, 1000);
}

function stopRinging() {
    if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
    }
}

// WebRTC functions
async function createPeerConnection(userId) {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }
    
    pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        remoteStreams.set(userId, remoteStream);
        elements.remoteVideo.srcObject = remoteStream;
    };
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
                candidate: event.candidate,
                targetId: userId
            });
        }
    };
    
    peerConnections.set(userId, pc);
    return pc;
}

async function makeCall(userId) {
    const pc = await createPeerConnection(userId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('webrtc-offer', {
        offer: offer,
        targetId: userId
    });
}

// Navigation
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showNotification(message, isSuccess = false) {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${isSuccess ? 'success' : ''}`;
    elements.notification.style.display = 'block';
    setTimeout(() => {
        elements.notification.style.display = 'none';
    }, 3000);
}

// Emoji picker functionality
const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','❤️','💙','💚','💛','🧡','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// Create emoji grid
emojis.forEach(emoji => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.addEventListener('click', () => {
        elements.messageText.value += emoji;
        elements.emojiPicker.style.display = 'none';
        elements.messageText.focus();
    });
    elements.emojiGrid.appendChild(span);
});

elements.emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.emojiPicker.style.display = elements.emojiPicker.style.display === 'block' ? 'none' : 'block';
});

// Image upload functionality
elements.imageBtn.addEventListener('click', () => {
    elements.imageInput.click();
});

elements.imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('send-message', {
                type: 'image',
                imageData: e.target.result
            });
        };
        reader.readAsDataURL(file);
    }
});

// Call functionality
elements.callBtn.addEventListener('click', () => {
    if (!isInCall) {
        socket.emit('start-call', { isVideo: false });
        elements.callModal.style.display = 'flex';
        elements.callType.textContent = 'Voice Call';
        elements.callStatus.textContent = 'Calling room members...';
        isInCall = true;
        isVideoCall = false;
    }
});

elements.videoCallBtn.addEventListener('click', async () => {
    if (!isInCall) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            elements.localVideo.srcObject = localStream;
            
            socket.emit('start-call', { isVideo: true });
            elements.callModal.style.display = 'flex';
            elements.callType.textContent = 'Video Call';
            elements.videoContainer.classList.add('active');
            elements.callStatus.textContent = 'Calling room members...';
            isInCall = true;
            isVideoCall = true;
        } catch (error) {
            showNotification('Camera access denied');
        }
    }
});

elements.acceptCallBtn.addEventListener('click', async () => {
    if (isVideoCall) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            elements.localVideo.srcObject = localStream;
            elements.videoContainer.classList.add('active');
        } catch (error) {
            showNotification('Camera access denied');
        }
    }
    
    socket.emit('accept-call', { callerId: currentCallerId });
    elements.incomingCallModal.style.display = 'none';
    elements.callModal.style.display = 'flex';
    elements.callStatus.textContent = 'Connected';
    stopRinging();
    isInCall = true;
});

elements.videoToggleBtn.addEventListener('click', () => {
    if (localStream) {
        isVideoEnabled = !isVideoEnabled;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = isVideoEnabled;
        });
        elements.videoToggleBtn.textContent = isVideoEnabled ? '📹' : '📹❌';
    }
});

elements.declineCallBtn.addEventListener('click', () => {
    socket.emit('decline-call', { callerId: currentCallerId });
    elements.incomingCallModal.style.display = 'none';
    stopRinging();
    currentCallerId = null;
});

elements.muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    elements.muteBtn.textContent = isMuted ? '🔇' : '🎤';
    elements.callStatus.textContent = isMuted ? 'Muted' : 'In call';
});

elements.endCallBtn.addEventListener('click', () => {
    socket.emit('end-call');
    elements.callModal.style.display = 'none';
    elements.videoContainer.classList.remove('active');
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    isInCall = false;
    isMuted = false;
    isVideoCall = false;
    isVideoEnabled = true;
    elements.muteBtn.textContent = '🎤';
    elements.videoToggleBtn.textContent = '📹';
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    if (!elements.emojiBtn.contains(e.target) && !elements.emojiPicker.contains(e.target)) {
        elements.emojiPicker.style.display = 'none';
    }
});

// Event listeners
elements.createRoomBtn.addEventListener('click', () => showScreen('create'));
elements.joinRoomBtn.addEventListener('click', () => {
    socket.emit('get-rooms');
    showScreen('join');
});

elements.backFromCreate.addEventListener('click', () => showScreen('home'));
elements.backFromJoin.addEventListener('click', () => showScreen('home'));

elements.createRoomSubmit.addEventListener('click', () => {
    const roomName = document.getElementById('new-room-name').value.trim();
    const password = document.getElementById('new-room-password').value;
    
    if (!roomName || !password) {
        showNotification('Please fill in all fields');
        return;
    }
    
    socket.emit('create-room', { roomName, password });
});

elements.joinRoomSubmit.addEventListener('click', () => {
    const username = document.getElementById('join-username').value.trim();
    const roomName = document.getElementById('room-select').value;
    const password = document.getElementById('join-password').value;
    
    if (!username || !roomName || !password) {
        showNotification('Please fill in all fields');
        return;
    }
    
    socket.emit('join-room', { roomName, password, username });
});

elements.leaveRoom.addEventListener('click', () => {
    socket.disconnect();
    socket.connect();
    currentRoom = null;
    showScreen('home');
    socket.emit('get-rooms');
});

elements.sendMessage.addEventListener('click', sendMessage);
elements.messageText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = elements.messageText.value.trim();
    if (!message) return;
    
    socket.emit('send-message', { message, type: 'text' });
    elements.messageText.value = '';
}

// Socket events
socket.on('room-created', (roomName) => {
    showNotification(`Room "${roomName}" created successfully!`, true);
    document.getElementById('new-room-name').value = '';
    document.getElementById('new-room-password').value = '';
    showScreen('home');
    socket.emit('get-rooms');
});

socket.on('room-error', (error) => {
    showNotification(error);
});

socket.on('join-success', (data) => {
    currentRoom = data.roomName;
    currentUserColor = data.userColor;
    elements.roomTitle.textContent = data.roomName;
    elements.messages.innerHTML = '';
    showScreen('chat');
    showNotification(`Joined room "${data.roomName}"`, true);
});

socket.on('join-error', (error) => {
    showNotification(error);
});

socket.on('rooms-list', (rooms) => {
    elements.roomsList.innerHTML = '';
    elements.roomSelect.innerHTML = '<option value="">Select a room</option>';
    
    if (rooms.length === 0) {
        elements.roomsList.innerHTML = '<p style="color: #666;">No rooms available</p>';
        return;
    }
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.textContent = room;
        roomElement.addEventListener('click', () => {
            document.getElementById('room-select').value = room;
            showScreen('join');
        });
        elements.roomsList.appendChild(roomElement);
        
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        elements.roomSelect.appendChild(option);
    });
});

socket.on('new-message', (data) => {
    const messageElement = document.createElement('div');
    
    if (data.type === 'group-call') {
        messageElement.className = 'group-call-message';
        messageElement.innerHTML = `
            <div>📞 ${data.starter} started a ${data.callType} call</div>
            <div>${data.timestamp}</div>
            <button class="join-call-btn" onclick="joinGroupCall('${data.callType}')">Join Call</button>
        `;
    } else {
        messageElement.className = 'message';
        messageElement.style.setProperty('--user-color', data.userColor);
        
        if (data.type === 'image') {
            messageElement.innerHTML = `
                <div class="username">${data.username}</div>
                <div class="timestamp">${data.timestamp}</div>
                <img src="${data.imageData}" alt="Shared image" onclick="window.open('${data.imageData}', '_blank')">
            `;
        } else {
            messageElement.innerHTML = `
                <div class="username">${data.username}</div>
                <div class="timestamp">${data.timestamp}</div>
                <div>${data.message}</div>
            `;
        }
    }
    
    elements.messages.appendChild(messageElement);
    elements.messages.scrollTop = elements.messages.scrollHeight;
});

// Global function for join call button
window.joinGroupCall = async (callType) => {
    try {
        if (callType === 'video') {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            elements.localVideo.srcObject = localStream;
            elements.videoContainer.classList.add('active');
            isVideoCall = true;
        } else {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        socket.emit('join-call', { isVideo: callType === 'video' });
        elements.callModal.style.display = 'flex';
        elements.callType.textContent = callType === 'video' ? 'Video Call' : 'Voice Call';
        elements.callStatus.textContent = 'Joining call...';
        isInCall = true;
        
    } catch (error) {
        showNotification('Media access denied');
    }
};

socket.on('user-joined', (username) => {
    showNotification(`${username} joined the room`, true);
});

socket.on('user-left', (username) => {
    showNotification(`${username} left the room`);
});

socket.on('user-list', (users) => {
    elements.userList.innerHTML = '';
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.style.borderLeft = `3px solid ${user.color}`;
        userElement.textContent = user.username;
        elements.userList.appendChild(userElement);
    });
});

// Call events
socket.on('incoming-call', (data) => {
    currentCallerId = data.callerId;
    elements.callerName.textContent = data.caller;
    elements.incomingCallModal.style.display = 'flex';
    startRinging();
    showNotification(`Incoming call from ${data.caller}`, true);
});

socket.on('call-started', (data) => {
    showNotification('Call started', true);
});

socket.on('joined-call', (data) => {
    elements.callStatus.textContent = 'Connected to call';
    if (data.isVideo) {
        elements.videoContainer.classList.add('active');
        isVideoCall = true;
    }
});

socket.on('call-participants', async (data) => {
    // Connect to existing participants
    for (const participant of data.participants) {
        await makeCall(participant.id);
    }
});

socket.on('user-joined-call', async (data) => {
    showNotification(`${data.username} joined the call`, true);
    // New user joined, they will initiate connection
});

socket.on('user-left-call', (username) => {
    showNotification(`${username} left the call`);
});

// WebRTC signaling events
socket.on('webrtc-offer', async (data) => {
    const pc = await createPeerConnection(data.senderId);
    await pc.setRemoteDescription(data.offer);
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('webrtc-answer', {
        answer: answer,
        targetId: data.senderId
    });
});

socket.on('webrtc-answer', async (data) => {
    const pc = peerConnections.get(data.senderId);
    if (pc) {
        await pc.setRemoteDescription(data.answer);
    }
});

socket.on('webrtc-ice-candidate', async (data) => {
    const pc = peerConnections.get(data.senderId);
    if (pc) {
        await pc.addIceCandidate(data.candidate);
    }
});

socket.on('call-ended', (ender) => {
    elements.callModal.style.display = 'none';
    elements.incomingCallModal.style.display = 'none';
    elements.videoContainer.classList.remove('active');
    stopRinging();
    
    // Cleanup WebRTC connections
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
    remoteStreams.clear();
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    isInCall = false;
    isMuted = false;
    isVideoCall = false;
    isVideoEnabled = true;
    currentCallerId = null;
    elements.muteBtn.textContent = '🎤';
    elements.videoToggleBtn.textContent = '📹';
    showNotification(`Call ended by ${ender}`);
});

// Initialize
socket.emit('get-rooms');
