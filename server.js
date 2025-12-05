// server.js - Crash Game WebSocket Proxy
let pingInterval = null;

const CRASH_SUBSCRIPTION_MESSAGE = {
    id: '1', 
    type: 'subscribe', 
    payload: {
        query: 'subscription { crash { event { ... on MultiplayerCrash { id, multiplier, status, hash { hash } } } } }'
    }
};

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs'); // 🔥 NEW: For saving history
const app = express();
const server = http.createServer(app);

// --- PERSISTENCE SETUP ---
const HISTORY_FILE = 'history.json';
let crashHistory = [];

// 1. Load existing history if available
if (fs.existsSync(HISTORY_FILE)) {
    try {
        const raw = fs.readFileSync(HISTORY_FILE);
        crashHistory = JSON.parse(raw);
        console.log(`📚 Loaded ${crashHistory.length} rounds from history.json`);
    } catch (e) {
        console.error('⚠️ Could not read history file, starting fresh.');
    }
}

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:8080", "http://127.0.0.1:5500"], 
        methods: ["GET", "POST"]
    }
});

// 2. Handle Client Connections
io.on('connection', (socket) => {
    console.log('✨ New Frontend Client Connected');
    
    // 🔥 Send the stored history immediately!
    socket.emit('history', crashHistory);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Proxy Server listening on http://localhost:${PORT}`);
    connectToStake(); 
});


// 3. Setup the Client Side (talking to the Stake WSS)
const WebSocket = require('ws');
const STAKE_WSS_URL = 'wss://stake.com/_api/websockets';
let stakeWS = null;

function connectToStake() {
    console.log(`⚡️ Attempting to connect to Stake at ${STAKE_WSS_URL}...`);
    
    stakeWS = new WebSocket(STAKE_WSS_URL, ['graphql-transport-ws'], { 
        headers: {
            'Host': 'stake.com', 
            'Origin': 'https://stake.com', 
            'Referer': 'https://stake.com/casino/home?game=crash', 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });

    stakeWS.on('open', () => {
        console.log('🔗 Connected to Stake WebSocket.');
        const initMessage = { type: 'connection_init', payload: {} }; 
        stakeWS.send(JSON.stringify(initMessage));
    });

    stakeWS.on('error', (error) => console.error('❌ Stake WS Error:', error.message));

    stakeWS.on('close', (code, reason) => {
        console.warn(`⚠️ Stake WS closed. Reconnecting...`);
        if (pingInterval) clearInterval(pingInterval);
        setTimeout(connectToStake, 5000); 
    });

    stakeWS.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'connection_ack') {
                stakeWS.send(JSON.stringify(CRASH_SUBSCRIPTION_MESSAGE));

            } else if (message.type === 'ping') {
                stakeWS.send(JSON.stringify({ type: 'pong' }));
                
            } else if (message.type === 'data' || message.type === 'next') {
                const crashData = message.payload.data.crash.event;

                // Send live update to client
                io.emit('liveMultiplierUpdate', crashData);

                // 🔥 NEW: If round crashed, save it to history!
                if (crashData.status === 'crash') {
                    // Add to front of history
                    crashHistory.unshift(crashData);
                    
                    // Keep only last 500
                    if (crashHistory.length > 500) crashHistory.pop();

                    // Save to disk
                    fs.writeFileSync(HISTORY_FILE, JSON.stringify(crashHistory, null, 2));
                }
            } 
        } catch (e) {
            // Ignore parse errors
        }
    });
}