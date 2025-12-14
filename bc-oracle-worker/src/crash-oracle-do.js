
export class CrashOracleDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.API_URL = 'https://bc.fun/api/game/bet/multi/history'; 
    
    // NEW STATE PROPERTIES
    this.history = []; // In-memory cache of the last 500 rounds (newest first)
    this.authCookie = null; // Dynamically updated cookie
    
    // Load state from storage on construction (CRITICAL FOR HISTORY ENDPOINT)
    this.state.blockConcurrencyWhile(async () => {
        this.history = (await this.state.storage.get('history')) || [];
        this.authCookie = await this.state.storage.get('auth_cookie');
        console.log(`[DO] ♻️ Rebooted. Loaded ${this.history.length} rounds of history. Auth cookie status: ${this.authCookie ? 'Present' : 'MISSING'}.`);
    });
  }

  // Helper function for sending data to all connected WebSockets
  broadcast(data) {
    const message = JSON.stringify(data);
    this.sessions.forEach(session => {
      try {
        session.send(message);
      } catch (err) {
        // Ignore send errors on closed sessions
      }
    });
  }
  
  _parseBCGameCrash(rawGame) {
    let details = {};
    try {
      if (rawGame.gameDetail) {
        details = JSON.parse(rawGame.gameDetail);
      }
    } catch (e) {
      console.error("[DO] Failed to parse gameDetail JSON string:", e.message);
    }
    
    return {
      id: String(rawGame.gameId || rawGame.id),
      multiplier: parseFloat(details.rate || 1.00), 
      status: 'crash',
      hash: details.hash || null
    };
  }
  
  // Debug function for clearing state
  async resetStorage() {
    await this.state.storage.deleteAll();
    this.history = []; 
    this.authCookie = null;
    console.log('[DO] 💥 STORAGE CLEARED: State reset.');
    return new Response('DO Storage Cleared and State Reset.', { status: 200 });
  }

  // --- Durable Object FETCH Handler (Endpoints) ---
  async fetch(request) {
    console.log('[DO] Connection request received.');

    const url = new URL(request.url);
    
    // 1. PUBLIC DEBUG: Reset Storage
    if (url.pathname === '/reset') {
        return this.resetStorage();
    }

    // 2. INTERNAL: Update Auth (Called by AuthWorker)
    if (url.pathname === '/internal/update-auth' && request.method === 'POST') {
        const data = await request.json();
        if (data.cookie && typeof data.cookie === 'string') {
            this.authCookie = data.cookie;
            await this.state.storage.put('auth_cookie', this.authCookie);
            console.log('[DO] 🔐 Auth Cookie updated via internal request.');
            return new Response('Auth Updated', { status: 200 });
        }
        return new Response('Invalid Data', { status: 400 });
    }

    // 3. PUBLIC: Fetch History (Called by Frontend)
    if (url.pathname === '/api/history') {
        // FIX: CORS HEADERS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", // Allows access from your 127.0.0.1
            "Content-Type": "application/json"
        };
        
        console.log(`[DO] 📤 Serving HTTP History request. Sending ${this.history.length} rounds.`);
        
        return new Response(JSON.stringify(this.history), { headers: corsHeaders });
    }

    // 4. PUBLIC: WebSocket Upgrade
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        server.accept();
        this.sessions.push(server);

        server.addEventListener('close', () => {
            this.sessions = this.sessions.filter((s) => s !== server);
        });

        // Ensure Alarm is running for polling
        try {
            const currentAlarm = await this.state.storage.getAlarm();
            if (currentAlarm == null) {
                console.log('[DO] No alarm found. Scheduling start in 5s.');
                await this.state.storage.setAlarm(Date.now() + 5000);
            }
        } catch (err) {
            console.error('[DO] Error setting alarm:', err);
        }

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }
    
    // FIX: CATCH-ALL FALLBACK RETURN
    return new Response('Not Found', { status: 404 });
  }

  // --- Durable Object Alarm/Polling Logic ---
  async alarm() {
    console.log('[DO] ⏰ Alarm triggered. Polling BC.Game...');
    
    try {
        const HARDCODED_COOKIE = 'invitation-alias-code=4cxse6dr; utm_source=4cxse6dr; smidV2=20251120225011f079e66678f76e6b2a2f3e190ae49bdc00523afb22711ac90; intercom-id-t87ss9s4=769c35a0-414b-4f37-9d0d-c0e9d4a93fe3; intercom-device-id-t87ss9s4=0d405518-2755-44c8-9f2b-5a7ec0945c2a; _ga=GA1.1.544033487.1763707833; rtgio_tid=v1.0.11663203642.19226370586; invitation-view-id=1851285226761736725; invitation-url=https%3A%2F%2Fbc.fun%2Fi-4cxse6dr-n%2F%3Fstag%3D43037_693bbee40ccfd1ec35f6fd7a%26p%3D%252Fsports%252F; s=; bcn=; SESSION=01apeavcsaqwxk19b1161ba46aa51fc0dafcdc129111f017b0; blueID=407b0e33-6da7-4a31-9b9b-696ef35783ac; slfps=a61a07529a69e235fcbabaf860a89f6de3fc1efb855aa20722a11495387d9218; _gcl_au=1.1.1194789826.1763707827.2144939403.1765523186.1765523191; JSESSIONID=ZTVlNDI3NzYtYjBmZi00ODJiLThkOGQtMjJjMTcwNjdjNWFj; visit-url=https%3A%2F%2Fbc.fun%2Fgame%2Fcrash; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2299950109%22%2C%22first_id%22%3A%2219b1161ba7b298-075ed5166786134-26061a51-1049088-19b1161ba7c330%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E5%BC%95%E8%8D%90%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fbc.fun%2Fgame%2Fcrash%22%2C%22%24latest_utm_source%22%3A%224cxse6dr%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTliMTE2MWJhN2IyOTgtMDc1ZWQ1MTY2Nzg2MTM0LTI2MDYxYTUxLTEwNDkwODgtMTliMTE2MWJhN2MzMzAiLCIkaWRlbnRpdHlfbG9naW5faWQiOiI5OTk1MDEwOSJ9%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%2299950109%22%7D%2C%22%24device_id%22%3A%2219b1161ba7b298-075ed5166786134-26061a51-1049088-19b1161ba7c330%22%7D; __cf_bm=ErPza0WyTc5I9I8OXze8TEn.n0ewgv6py.Ll4fD5uSA-1765684245-1.0.1.1-4YNw4JDyZmt6HqsWHpxxGH9ga2FuEpIbgKHWywDN98nuz4ybBbWWJy_rIo4YhRmkvlD75SKxPohblVQCTjpm01ftgN1FgAP9PC83cOdKCJQ; _ga_B23BPN2TGE=GS2.1.s1765684906$o15$g0$t1765684906$j60$l0$h692871115; .thumbcache_1f3830c3848041ef5612f684078f2210=SSpUSrl+WYk+AVGM9jl+Ey/Z/Qe+MfumyDUTIcFNsEJ87gXoj0jhyolslBz8PQqDv+qUhJ2+kRLfRI20X9Z/Fw%3D%3D; intercom-session-t87ss9s4=RVVuQ3huUzBYcTNOaU9PNHl5TVdnSkxUbitpWjA4by9CekdrVStiZmRrTUkzMGpDR3p0STRUUTJlWWx2RDZ1NE40c2VKb0hYOTVXVEZ0SWU2amt2NVJURmQxVGcvSll6b3VxTk5BL2JTU1k9LS1YL3M4akE5bkM1bktFbWxQYXNzOEpnPT0=--c840dff87ea2c39e85d8bc1a9a2ee29f7747cef1'; 

        const cookieToUse = this.authCookie || HARDCODED_COOKIE;
        
        if (!this.authCookie) {
             console.warn('[DO] ⚠️ Polling using HARDCODED backup cookie. Deploy AuthWorker soon!');
        } else {
             console.log('[DO] 🍪 Polling using dynamically updated cookie.');
        }

        const response = await fetch(this.API_URL, {
            method: 'POST',
            // --- UPDATED HEADERS ---
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://bc.fun',
                'Referer': 'https://bc.fun/', 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': cookieToUse, // Use dynamic or fallback cookie
            },
            // --- END UPDATED HEADERS ---
            body: JSON.stringify({
                gameUrl: 'crash',
                page: 1,
                pageSize: 50
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DO] ❌ CRITICAL POLLING ERROR: BC API Error', response.status, errorText);
            await this.state.storage.setAlarm(Date.now() + 5000);
            return;
        }

        const data = await response.json();
        const crashRounds = (data.data && data.data.list) || [];
        
        if (crashRounds.length === 0) {
            console.log('[DO] ⚠️ Polling received empty response (0 rounds).');
            await this.state.storage.setAlarm(Date.now() + 5000);
            return;
        }

        // --- Processing Logic ---
        let lastId = await this.state.storage.get('last_id') || 0;
        let historyUpdated = false; 
        
        // Reverse to process Oldest -> Newest
        const sortedGames = crashRounds.reverse();

        for (const game of sortedGames) {
          const gameId = parseInt(game.gameId || game.id);

          if (gameId > lastId) {
            const formattedGame = this._parseBCGameCrash(game);
            
            console.log(`[DO] 🚀 Broadcasting New Game: ${formattedGame.id} @ ${formattedGame.multiplier}x`);
            this.broadcast(formattedGame);

            // CRUCIAL: UPDATE IN-MEMORY HISTORY
            this.history.unshift(formattedGame);
            if (this.history.length > 500) this.history.length = 500;
            historyUpdated = true;

            lastId = gameId;
            await this.state.storage.put('last_id', lastId);
          }
        }
        
        // CRUCIAL: SAVE HISTORY TO STORAGE
        if (historyUpdated) {
            console.log(`[DO] 💾 History saved to storage. Total rounds: ${this.history.length}`);
            await this.state.storage.put('history', this.history);
        }

    } catch (e) {
        console.error('[DO] 🛑 CRITICAL UNCAUGHT ERROR in alarm():', e.message);
    }
    
    await this.state.storage.setAlarm(Date.now() + 5000);
  }
}