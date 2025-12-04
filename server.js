// server.js - Crash Game WebSocket Proxy
let pingInterval = null;

// 🔥 CRITICAL FIX: The GraphQL query is updated to query the hash's subfield 'hash'.
const CRASH_SUBSCRIPTION_MESSAGE = {
    id: '1', // A unique ID for this subscription stream
    type: 'subscribe', 
    payload: {
        // The correct syntax: hash { hash } to query the string value inside the hash object.
        query: 'subscription { crash { event { ... on MultiplayerCrash { id, multiplier, status, hash { hash } } } } }'
    }
};

// 1. Setup the Server Side (talking to the Predictor Tool)
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);

// Initialize socket.io for client communication (your predictor tool)
const io = new Server(server, {
    cors: {
        // 🔥 CRITICAL FIX: Allowing multiple origins for your Live Server setup
        origin: ["http://localhost:8080", "http://127.0.0.1:5500"], 
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Proxy Server listening on http://localhost:${PORT}`);
    connectToStake(); // Start the connection to Stake once our server is running
});


// 2. Setup the Client Side (talking to the Stake WSS)
const WebSocket = require('ws');
const STAKE_WSS_URL = 'wss://stake.com/_api/websockets';
let stakeWS = null;

function connectToStake() {
    console.log(`⚡️ Attempting to connect to Stake at ${STAKE_WSS_URL}...`);
    
    // CRITICAL FIX: The server demands the 'graphql-transport-ws' subprotocol.
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

    // --- Connection Events ---
    stakeWS.on('open', () => {
        console.log('🔗 Successfully connected to Stake WebSocket.');

        // 1. Send Connection_INIT to start the GraphQL-WS protocol
        const initMessage = { 
            type: 'connection_init', 
            payload: {} // Clean, empty payload
        }; 
        
        stakeWS.send(JSON.stringify(initMessage));
        console.log('➡️ Sent: connection_init');
    });

    // --- Error and Close Events ---
    stakeWS.on('error', (error) => {
        console.error('❌ Stake WS Error:', error.message);
    });

    stakeWS.on('close', (code, reason) => {
        // Log the exact close code and reason for debugging
        console.warn(`⚠️ Stake WS closed. Code: ${code}. Reason: ${reason.toString()}. Reconnecting in 5 seconds...`);

        // Stop the ping loop when connection closes
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }

        // Automatically reconnect after a delay
        setTimeout(connectToStake, 5000); 
    });

    // --- Message Handler ---
    stakeWS.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            // Check the type of message from the server
            if (message.type === 'connection_ack') {
                // 2. Send the crash game subscription after the handshake is acknowledged
                stakeWS.send(JSON.stringify(CRASH_SUBSCRIPTION_MESSAGE));
                console.log('✅ Received: connection_ack. Starting crash game subscription...');

            } else if (message.type === 'ping') {
                // Server sends 'ping'. Client MUST respond with 'pong'.
                const pongMessage = JSON.stringify({ type: 'pong' });
                stakeWS.send(pongMessage);
                
            } else if (message.type === 'data' || message.type === 'next') {
                // This is the actual game data!
                const crashData = message.payload.data.crash.event;

                // 1. Log the incoming data (keep for debugging)
                console.log('⬇️ Received Game Data:', crashData); 
                
                // 2. 🔥 CRITICAL CHANGE: Emit the data to all connected predictor clients!
                io.emit('liveMultiplierUpdate', crashData);

            } else if (message.type === 'error') {
                // Log GraphQL errors cleanly
                console.error('❌ GraphQL Error:', message.payload);
            } else {
                // Log all other messages for debugging
                console.log('⬇️ Received Unknown Message:', message);
            }

        } catch (e) {
            // Handle non-JSON messages (like raw text pings or binary data)
            console.log('⬇️ Received Non-JSON Data:', data.toString());
        }
    });
}