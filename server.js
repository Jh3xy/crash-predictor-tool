// server.js - Crash Game WebSocket Proxy (FINAL VERSION)

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:8080", "http://127.0.0.1:5500", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

// ======================== PERSISTENT HISTORY ========================
const HISTORY_FILE = 'history.json';
let crashHistory = [];

// Load existing history on startup
if (fs.existsSync(HISTORY_FILE)) {
    try {
        const raw = fs.readFileSync(HISTORY_FILE);
        crashHistory = JSON.parse(raw);
        console.log(`Loaded ${crashHistory.length} rounds from history.json`);
        if (crashHistory.length >= 500) {
            console.log(`FULL 500-ROUND HISTORY ACHIEVED ON STARTUP — Ready for accurate predictions!`);
        }
    } catch (e) {
        console.error('Could not read history file, starting fresh.');
        crashHistory = [];
    }
} else {
    console.log('No history.json found — starting fresh collection.');
}

// ======================== SOCKET.IO TO FRONTEND ========================
io.on('connection', (socket) => {
    console.log('New Frontend Client Connected');
    
    // Send full current history immediately
    socket.emit('history', crashHistory);
});

// ======================== STAKE WEBSOCKET CLIENT ========================
const WebSocket = require('ws');
const STAKE_WSS_URL = 'wss://stake.com/_api/websockets';
let stakeWS = null;

const CRASH_SUBSCRIPTION_MESSAGE = {
    id: '1',
    type: 'subscribe',
    payload: {
        query: 'subscription { crash { event { ... on MultiplayerCrash { id, multiplier, status, hash { hash } } } } }'
    }
};
function connectStake() {
    const ws = new WebSocket('wss://stake.com/_api/websockets', ['graphql-transport-ws'], {
        headers: {
            'Origin': 'https://stake.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': 'https://stake.com/casino/games/crash',
            'Sec-WebSocket-Version': '13',
            'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
            'Connection': 'keep-alive, Upgrade',
            'Upgrade': 'websocket'
        }
    });

    ws.on('open', () => {
        console.log('Connected to Stake — sending init...');
        ws.send(JSON.stringify({ type: 'connection_init', payload: {} }));
        setTimeout(() => {
            ws.send(JSON.stringify({
                id: '1',
                type: 'subscribe',
                payload: { query: 'subscription { crash { event { ... on MultiplayerCrash { id, multiplier, status, hash { hash } } } } }' }
            }));
        }, 800);
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'data' || msg.type === 'next') {
                const crash = msg.payload?.data?.crash?.event;
                if (crash) {
                    io.emit('liveMultiplierUpdate', crash);
                    if (crash.status === 'crash') {
                        crashHistory.unshift(crash);
                        if (crashHistory.length > 500) crashHistory = crashHistory.slice(0, 500);
                        fs.writeFileSync(HISTORY_FILE, JSON.stringify(crashHistory, null, 2));
                        console.log(`CRASH ${crash.multiplier.toFixed(2)}x | History: ${crashHistory.length}/500`);
                    }
                }
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        console.log('Stake connection lost — reconnecting in 5s...');
        setTimeout(connectStake, 5000);
    });
}

// function connectStake() {
//     {
//     // WORKING 2025 PROXY — beats Stake blocks 100%
//     const PROXY_URL = 'wss://ws-proxy.stakecrash.workers.dev';

//     const ws = new WebSocket(PROXY_URL);

//     ws.on('open', () => {
//         console.log('Connected via proxy — subscribing to Stake Crash...');
//         ws.send(JSON.stringify({
//             id: "1",
//             type: "subscribe",
//             payload: {
//                 query: "subscription { crash { event { ... on MultiplayerCrash { id multiplier status hash { hash } } } } }"
//             }
//         }));
//     });

//     ws.on('message', (data) => {
//         try {
//             const msg = JSON.parse(data.toString());
//             if (msg.type === 'data' || msg.type === 'next') {
//                 const crash = msg.payload?.data?.crash?.event;
//                 if (crash) {
//                     io.emit('liveMultiplierUpdate', crash);

//                     if (crash.status === 'crash') {
//                         crashHistory.unshift(crash);
//                         if (crashHistory.length > 500) crashHistory = crashHistory.slice(0, 500);
//                         fs.writeFileSync(HISTORY_FILE, JSON.stringify(crashHistory, null, 2));
//                         console.log(`CRASH: ${crash.multiplier.toFixed(2)}x | History: ${crashHistory.length}/500`);
//                     }
//                 }
//             }
//         } catch (e) {}
//     });

//     ws.on('close', () => {
//         console.log('Proxy closed — reconnecting in 5s...');
//         setTimeout(connectStake, 5000);
//     });

//     ws.on('error', () => {
//         setTimeout(connectStake, 5000);
//     });
// }}

// ======================== START SERVER ========================
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Proxy Server running → http://localhost:${PORT}`);
    connectStake();
});