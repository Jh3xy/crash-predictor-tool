
export class CrashOracleDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    // The correct API endpoint
    this.API_URL = 'https://bc.fun/api/game/bet/multi/history'; 
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
  
  // // Helper function to format the new API data
  // _parseBCGameCrash(rawGame) {
  //   return {
  //     // Use new keys (gameId, rate) but keep old keys (id, crash_point) as fallbacks
  //     id: String(rawGame.gameId || rawGame.id),
  //     multiplier: parseFloat(rawGame.rate || rawGame.crash_point),
  //     status: 'crash',
  //     hash: rawGame.hash || null
  //   };
  // }
  // Helper function to format the new API data

_parseBCGameCrash(rawGame) {

  // First, parse the nested JSON string from the 'gameDetail' key

  let details = {};

  try {

    if (rawGame.gameDetail) {

      details = JSON.parse(rawGame.gameDetail);

    }

  } catch (e) {

    console.error("[DO] Failed to parse gameDetail JSON string:", e.message);

  }

  

  // Now we access the correct key 'rate' from the newly parsed 'details' object

  return {

    id: String(rawGame.gameId || rawGame.id),

    // Use 'details.rate' which is where the multiplier lives

    multiplier: parseFloat(details.rate || 1.00), 

    status: 'crash',

    hash: details.hash || null

  };

}
  // --- TEMPORARY STORAGE CLEAR FUNCTION (For debugging the "0 rounds" issue) ---
  async resetStorage() {
    await this.state.storage.deleteAll();
    console.log('[DO] 💥 STORAGE CLEARED: last_id has been reset to 0.');
    return new Response('DO Storage Cleared. Ready to process latest games.', { status: 200 });
  }
  // ----------------------------------------


  // --- WebSocket Connection Logic ---
  async fetch(request) {
    console.log('[DO] Connection request received.');

    const url = new URL(request.url);
    // CHECK 1: If the path is /reset, run the clear function
    if (url.pathname === '/reset') {
        return this.resetStorage();
    }
    
    // CHECK 2: Standard WebSocket setup
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

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

  // --- Durable Object Alarm/Polling Logic (CRITICAL) ---
  async alarm() {
    console.log('[DO] ⏰ Alarm triggered. Polling BC.Game...');
    
    try {
        // 🚨 CRITICAL: Use your live, full BC.Game Cookie string here 🚨
        const COOKIE_HEADER_VALUE = 'invitation-alias-code=4cxse6dr; utm_source=4cxse6dr; smidV2=20251120225011f079e66678f76e6b2a2f3e190ae49bdc00523afb22711ac90; intercom-id-t87ss9s4=769c35a0-414b-4f37-9d0d-c0e9d4a93fe3; intercom-device-id-t87ss9s4=0d405518-2755-44c8-9f2b-5a7ec0945c2a; _ga=GA1.1.544033487.1763707833; rtgio_tid=v1.0.11663203642.19226370586; invitation-view-id=1851285226761736725; invitation-url=https%3A%2F%2Fbc.fun%2Fi-4cxse6dr-n%2F%3Fstag%3D43037_693bbee40ccfd1ec35f6fd7a%26p%3D%252Fsports%252F; s=; bcn=; SESSION=01apeavcsaqwxk19b1161ba46aa51fc0dafcdc129111f017b0; blueID=407b0e33-6da7-4a31-9b9b-696ef35783ac; slfps=a61a07529a69e235fcbabaf860a89f6de3fc1efb855aa20722a11495387d9218; _gcl_au=1.1.1194789826.1763707827.2144939403.1765523186.1765523191; JSESSIONID=ZTVlNDI3NzYtYjBmZi00ODJiLThkOGQtMjJjMTcwNjdjNWFj; visit-url=https%3A%2F%2Fbc.fun%2Fgame%2Fcrash; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2299950109%22%2C%22first_id%22%3A%2219b1161ba7b298-075ed5166786134-26061a51-1049088-19b1161ba7c330%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E5%BC%95%E8%8D%90%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fbc.fun%2Fgame%2Fcrash%22%2C%22%24latest_utm_source%22%3A%224cxse6dr%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTliMTE2MWJhN2IyOTgtMDc1ZWQ1MTY2Nzg2MTM0LTI2MDYxYTUxLTEwNDkwODgtMTliMTE2MWJhN2MzMzAiLCIkaWRlbnRpdHlfbG9naW5faWQiOiI5OTk1MDEwOSJ9%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%2299950109%22%7D%2C%22%24device_id%22%3A%2219b1161ba7b298-075ed5166786134-26061a51-1049088-19b1161ba7c330%22%7D; __cf_bm=XFcfmw23kcqidXqPUKgrRhgquAvROcYQgPZqqTkSxG8-1765587989-1.0.1.1-bQMdshqMIW17i8I3D0BsZzM.SJJbgYaEikLT4ICYcLXJv9nO8ScDUO3u9uVRFnLgLnhp8TShsMWVyN9MyXhCyGtg1LSHot79q4kTCTry20o; intercom-session-t87ss9s4=SUYyWGowNkNqY0J5R2prWDJvRTF3ZXpUTld3ZnYyNTZ4ZXVBMmE3b3ZpWUhVd0F2Y1BYYldISTVFQ3o1NW9Da3lKM2FvYTRtTUFGcUZiY0FrQk15NDdpQkZTbCtkRXA0bEhodGVUakMxVVk9LS01R2k1RDJWTWVIeUZyalBFaTZWYUN3PT0=--f9f58f0a316ccaefe9aabe4fe19fb8d8de013e5f; _ga_B23BPN2TGE=GS2.1.s1765588012$o7$g0$t1765588012$j60$l0$h1729679873; .thumbcache_1f3830c3848041ef5612f684078f2210=DOuaQyp3/hIJzZuO7hcUwZKjkyGZhlz6amucwSTBHWNFLGQ5+q0Yqh6BKMM30ujsY3tvKDLCtQ+WJUTLY0HBOA%3D%3D'; 

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Mimic a real browser's headers
                'Origin': 'https://bc.fun',
                'Referer': 'https://bc.fun/', // This should be 'https://bc.fun/' for stability
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': COOKIE_HEADER_VALUE,
            },
            // ✅ FIX 1: Use the exact payload keys found in your browser inspection
            body: JSON.stringify({
                gameUrl: 'crash', // Corrected key
                page: 1,          // Added 'page'
                pageSize: 50      // Corrected key and limit
            }),
        });

        if (!response.ok) {
            // Error handling remains the same
            const errorText = await response.text();
            console.error('[DO] ❌ CRITICAL POLLING ERROR: BC API Error', response.status, errorText);
            await this.state.storage.setAlarm(Date.now() + 5000);
            return;
        }

        const data = await response.json();
        
        // ✅ FIX 2: Look in the correct response field: data.data.list
        const crashRounds = (data.data && data.data.list) || [];
        
        if (crashRounds.length === 0) {
            console.log('[DO] ⚠️ Polling received empty or unexpected response (0 rounds).');
            await this.state.storage.setAlarm(Date.now() + 5000);
            return;
        }

        // --- Processing Logic ---
        let lastId = await this.state.storage.get('last_id') || 0;
        
        // Reverse to process Oldest -> Newest
        const sortedGames = crashRounds.reverse();

        for (const game of sortedGames) {
          const gameId = parseInt(game.gameId || game.id);

          if (gameId > lastId) {
            const formattedGame = this._parseBCGameCrash(game);
            
            console.log(`[DO] 🚀 Broadcasting New Game: ${formattedGame.id} @ ${formattedGame.multiplier}x`);
            this.broadcast(formattedGame);

            lastId = gameId;
            await this.state.storage.put('last_id', lastId);
          }
        }

    } catch (e) {
        console.error('[DO] 🛑 CRITICAL UNCAUGHT ERROR in alarm():', e.message);
    }
    
    // Schedule next run
    await this.state.storage.setAlarm(Date.now() + 5000);
  }
}