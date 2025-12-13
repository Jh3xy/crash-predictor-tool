

// server.js - STAKE CRASH PROXY THAT ACTUALLY WORKS (Dec 2025)

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const fetch = require('node-fetch');  // ← this line is now valid
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ======================== HISTORY ========================
const HISTORY_FILE = 'history.json';
let crashHistory = [];

if (fs.existsSync(HISTORY_FILE)) {
    try {
        crashHistory = JSON.parse(fs.readFileSync(HISTORY_FILE));
        console.log(`Loaded ${crashHistory.length} historical crashes`);
    } catch (e) { console.log("Starting with empty history"); }
}

// Send history to every new frontend
io.on('connection', (socket) => {
    console.log('Frontend connected');
    socket.emit('history', crashHistory);
});

// ======================== POLL STAKE EVERY 4 SECONDS ========================
let lastGameId = null;

async function pollStake() {
    try {
        const response = await fetch('https://api.stake.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': '433ccf90d9703c6333fec14e175e77c9657409f922dd2cef2644337d096eadffc381b77d5921c6c6b713e6e42511f01d', // ← your session
                'Origin': 'https://stake.com',
                'Referer': 'https://stake.com/casino/games/crash',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                operationName: null,
                variables: {},
                query: `
                {
                  crash {
                    active
                    game {
                      id
                      state
                      multiplier
                      crashPoint
                      hash
                    }
                  }
                }`
            })
        });

        if (response.status === 403) {
            console.log("Warning: 403 — Your session token is dead or IP flagged. Get a new one from browser.");
            return;
        }

        const json = await response.json();
        const game = json?.data?.crash?.game;

        if (game && game.id !== lastGameId && game.state === "crashed") {
            lastGameId = game.id;
            const crashData = {
                id: game.id,
                multiplier: parseFloat(game.crashPoint),
                status: "crash",
                hash: { hash: game.hash }
            };

            crashHistory.unshift(crashData);
            if (crashHistory.length > 500) crashHistory.pop();
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(crashHistory, null, 2));

            console.log(`CRASHED @ ${crashData.multiplier.toFixed(2)}x — History: ${crashHistory.length}/500`);
            io.emit('liveMultiplierUpdate', crashData);
            io.emit('raw', json);
        }

    } catch (e) {
        // Silent fail — happens sometimes
    }
}

// ======================== START ========================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Stake proxy running → http://localhost:${PORT}`);
    setInterval(pollStake, 4000);  // every 4 seconds = perfect
    pollStake(); // immediate first poll
});