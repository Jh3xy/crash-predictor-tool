/**
 * js/LiveSyncing.js
 * Final working version with round counter + no flashing UUID
 */

export class LiveSync {
    constructor(dataStore, verifier, eventBus) {
        this.dataStore = dataStore;
        this.verifier = verifier;
        this.eventBus = eventBus;
        this.currentGameId = null;
        this.currentMultiplier = 1.00;
        this.isRoundRunning = false;
        this.ws = null;
        this.roundCounter = 0;

        console.log("LiveSync: Initialized in Live WebSocket Mode.");
    }

    connect() {
        const PROXY_URL = 'http://localhost:3000';

        if (typeof io === 'undefined') {
            console.error("Socket.IO client is not loaded.");
            return;
        }

        this.ws = io(PROXY_URL);

        this.ws.on('connect', () => {
            console.log('Socket.IO connected to local proxy.');
            this.updateAllDisplays();
        });

        this.ws.on('disconnect', () => {
            console.log('Socket.IO disconnected.');
            this.updateAllDisplays();
        });

        this.ws.on('history', (rawHistory) => {
            console.log(`Received ${rawHistory.length} rounds of history from server.`);
            const standardizedHistory = rawHistory.map(item => this.standardizeRound(item));
            this.dataStore.setHistory(standardizedHistory);
            this.updateModalHistory();
            this.eventBus.emit('historyLoaded');
        });

        this.ws.on('liveMultiplierUpdate', (crashData) => {
            // Detect new round
            if (crashData.id && crashData.id !== this.currentGameId) {
                this.roundCounter++;
            }
            this.currentGameId = crashData.id;

            if (crashData.status === 'in_progress') {
                this.currentMultiplier = crashData.multiplier;
                this.isRoundRunning = true;
                this.eventBus.emit('multiplierUpdate', crashData.multiplier);

            } else if (crashData.status === 'crash') {
                this.isRoundRunning = false;
                const standardizedRound = this.standardizeRound(crashData);
                this.dataStore.addRound(standardizedRound);
                this.verifier.verify(standardizedRound);
                this.eventBus.emit('newRoundCompleted', standardizedRound);
                this.currentMultiplier = 1.00;
            }

            this.updateAllDisplays();
        });
    }

    getCurrentRoundDisplay() {
        return `Round ${this.roundCounter}`;
    }

    updateAllDisplays() {
        this.updateModalLiveValue();
        this.updateModalHistory();
        this.updateModalDiagnostics();
        this.updateAnalyzerRoundDisplay();  // For the Analyzer tab
    }

    updateModalLiveValue() {
        const el = document.getElementById('live-sync-current-multiplier');
        if (el) {
            el.textContent = this.isRoundRunning 
                ? `${this.currentMultiplier.toFixed(2)}x` 
                : "STARTING";
        }
    }

    updateModalHistory() {
        const container = document.getElementById('live-sync-history-container');
        if (!container) return;

        const history = this.dataStore.getMultipliers().slice(0, 20);
        container.innerHTML = '';
        history.forEach(value => {
            const badge = document.createElement('div');
            badge.className = `history-badge ${this.getBadgeClass(value)}`;
            badge.textContent = value.toFixed(2) + 'x';
            container.appendChild(badge);
        });
    }

    updateModalDiagnostics() {
        const statusMessageEl = document.getElementById('status-message');
        const statusDotEl = document.querySelector('.status-indicator');
        const gameIdEl = document.getElementById('sync-game-id');
        const lastSyncEl = document.getElementById('sync-last-time');

        if (gameIdEl) {
            gameIdEl.textContent = this.getCurrentRoundDisplay();
        }
        if (lastSyncEl) {
            lastSyncEl.textContent = new Date().toLocaleTimeString();
        }

        if (statusMessageEl) {
            if (this.ws && this.ws.connected) {
                statusMessageEl.textContent = this.isRoundRunning
                    ? `${this.getCurrentRoundDisplay()} Running...`
                    : `${this.getCurrentRoundDisplay()} Starting...`;
            } else {
                statusMessageEl.textContent = 'Connecting...';
            }
        }

        if (statusDotEl) {
            if (this.ws && this.ws.connected) {
                statusDotEl.className = this.isRoundRunning
                    ? 'status-indicator status-connected'
                    : 'status-indicator status-starting';
            } else {
                statusDotEl.className = 'status-indicator status-disconnected';
            }
        }
    }

    updateAnalyzerRoundDisplay() {
        const el = document.getElementById('predicted-round-id');
        if (el) {
            el.textContent = `Target: ${this.getCurrentRoundDisplay()}`;
        }
    }

    getBadgeClass(value) {
        if (value >= 10.0) return 'm-high';
        if (value >= 2.0) return 'm-medium';
        return 'm-low';
    }

    standardizeRound(crashData) {
        const finalMultiplier = crashData.multiplier || 1.00;
        let roundHash = `PENDING`;
        if (crashData.hash) {
            if (typeof crashData.hash === 'object' && crashData.hash.hash) {
                roundHash = `stake-hash-${crashData.hash.hash}`;
            } else if (typeof crashData.hash === 'string') {
                roundHash = `stake-hash-${crashData.hash}`;
            }
        } else {
            roundHash = `game-id-${crashData.id}-PENDING_HASH`;
        }

        return {
            gameId: crashData.id,
            finalMultiplier: finalMultiplier,
            clientSeed: roundHash,
            nonce: 0,
            verificationStatus: 'Live Official Data'
        };
    }
}