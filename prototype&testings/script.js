
/*
  Browser-side tools:
  - computeHMACHex(serverSeed, message) via SubtleCrypto
  - crashMultiplierFromSeeds(serverSeed, clientSeed, nonce)
  - predictor: simple heuristic functions
*/

async function computeHMACHex(keyStr, msgStr) {
  // keyStr: server_seed, msgStr: `${clientSeed}:${nonce}`
  const enc = new TextEncoder();
  const keyData = enc.encode(keyStr);
  const msgData = enc.encode(msgStr);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, {name:"HMAC", hash:"SHA-256"}, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hex = bufferToHex(sig);
  return hex;
}

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Crash formula using first 13 hex chars = 52 bits
function multiplierFromHashFirst13Hex(first13hex) {
  // Use BigInt math because numbers are big
  const r = BigInt('0x' + first13hex); // 0 <= r < 2**52
  const e = (1n << 52n);
  if (r === 0n) return Infinity;
  const numerator = 100n * e;
  const denom = e - r;
  const floored = numerator / denom; // integer division
  // convert to Number with two decimals
  return Number(floored) / 100.0;
}

async function crashMultiplier(serverSeed, clientSeed, nonce) {
  const msg = `${clientSeed}:${nonce}`;
  const hex = await computeHMACHex(serverSeed, msg);
  const first13 = hex.slice(0,13);
  return {
    hmac: hex,
    first13,
    multiplier: multiplierFromHashFirst13Hex(first13)
  };
}

// UI: verifier
document.getElementById('verifyBtn').addEventListener('click', async () => {
  const ss = document.getElementById('serverSeed').value.trim();
  const cs = document.getElementById('clientSeed').value.trim();
  const nRaw = document.getElementById('nonce').value.trim();
  const out = document.getElementById('verifyOutput');
  out.innerHTML = '<div class="small">computing…</div>';
  if (!ss || !cs || !nRaw) { out.innerHTML = '<div class="small">fill server/client/nonce</div>'; return; }
  const nonce = parseInt(nRaw,10);
  try {
    const res = await crashMultiplier(ss, cs, nonce);
    out.innerHTML = `<div><strong>multiplier: ${res.multiplier}x</strong></div>
                     <div class="small">HMAC: <code style="font-size:12px">${res.hmac}</code></div>
                     <div class="small">first13 hex (52 bits): ${res.first13}</div>`;
  } catch (err) {
    out.innerHTML = '<div class="small">error: ' + err.message + '</div>';
  }
});

/* -------------------------
   Predictor (heuristic)
   ------------------------- */

function parseHistory(raw) {
  if (!raw) return [];
  const items = raw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  return items.map(x => {
    const v = parseFloat(x);
    return isFinite(v) ? v : null;
  }).filter(x => x !== null);
}

function stats(arr) {
  if (!arr.length) return {mean:0,std:0,median:0};
  const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
  const variance = arr.reduce((a,b)=>a + (b-mean)*(b-mean),0)/arr.length;
  const std = Math.sqrt(variance);
  const sorted = [...arr].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length/2);
  const median = sorted.length%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
  return {mean,std,median};
}

// empirical CDF: P(X <= t)
function empiricalCDF(arr, t) {
  if (!arr.length) return 0;
  let cnt = 0;
  for (const v of arr) if (v <= t) cnt++;
  return cnt / arr.length;
}

// simple predictor strategies
function predictEmpirical(arr) {
  // predict weighted mean but emphasize tail values
  const s = stats(arr);
  // robust mean: trim top/bottom 10%
  const sorted = [...arr].sort((a,b)=>a-b);
  const trim = Math.floor(sorted.length * 0.1);
  const trimmed = sorted.slice(trim, sorted.length - trim || undefined);
  const tmean = trimmed.reduce((a,b)=>a+b,0)/trimmed.length;
  // point = blend of tmean and 1st-decile/90th-decile
  const p10 = sorted[Math.max(0, Math.floor(sorted.length*0.1))] || s.mean;
  const p90 = sorted[Math.max(0, Math.floor(sorted.length*0.9))] || s.mean;
  const point = (tmean*0.6 + p90*0.2 + p10*0.2);
  const conf = Math.max(5, Math.min(95, 80 - s.std*8)); // heuristic: less volatile => more confident
  return {point: Number(point.toFixed(2)), conf: Math.round(conf)};
}

function predictStreakAware(arr) {
  // detect low-multiplier streaks (<=1.1) and high-multiplier spikes
  const last = arr.slice(-10);
  let lowStreak = 0;
  for (let i = last.length-1; i>=0; i--) {
    if (last[i] <= 1.1) lowStreak++; else break;
  }
  const s = stats(arr);
  let point = s.mean;
  if (lowStreak >= 3) {
    // revert-to-mean or chance of spike: boost prediction moderately
    point = Math.max(s.mean, s.mean * (1 + Math.min(0.5, lowStreak * 0.12)));
  } else {
    // small downward bias if recent few are high
    const recentMean = stats(arr.slice(-5)).mean;
    point = recentMean * 0.95 + s.mean*0.05;
  }
  const conf = Math.max(3, Math.min(90, 70 - s.std*6 + lowStreak*3));
  return {point: Number(point.toFixed(2)), conf: Math.round(conf)};
}

function predictCombined(arr) {
  const w = Math.min(100, Math.max(5, parseInt(document.getElementById('windowSize').value,10)));
  const recent = arr.slice(-w);
  if (!recent.length) return {point:1.0, conf:20};
  const e = predictEmpirical(recent);
  const s = predictStreakAware(arr);
  // combine by confidence-weighted average
  const total = e.conf + s.conf;
  const point = (e.point*e.conf + s.point*s.conf) / (total || 1);
  const conf = Math.round(Math.min(98, (e.conf + s.conf) / 2));
  return {point: Number(point.toFixed(2)), conf};
}

document.getElementById('predictBtn').addEventListener('click', () => {
  const raw = document.getElementById('historyInput').value;
  const arr = parseHistory(raw);
  const out = document.getElementById('predictOutput');
  if (arr.length < 5) { out.innerHTML = '<div class="small">need at least 5 data points for meaningful prediction</div>'; return; }
  const strat = document.getElementById('strategy').value;
  let res;
  if (strat === 'empirical') res = predictEmpirical(arr);
  else if (strat === 'streak') res = predictStreakAware(arr);
  else res = predictCombined(arr);

  // produce probability-based hints: P(next < 1.2), P(next < 2), P(next >= 5)
  const pLT1_2 = empiricalCDF(arr, 1.2);
  const pLT2 = empiricalCDF(arr, 2.0);
  const pGE5 = 1 - empiricalCDF(arr, 5.0);

  out.innerHTML = `<div><strong>Predicted next multiplier: ${res.point}x</strong> — confidence ${res.conf}%</div>
                   <div class="small">Empirical: P(&lt;=1.2)=${(pLT1_2*100).toFixed(1)}% · P(&lt;=2)=${(pLT2*100).toFixed(1)}% · P(&gt;=5)=${(pGE5*100).toFixed(2)}%</div>
                   <div style="margin-top:8px"><button id="savePred">Copy prediction</button></div>`;
  document.getElementById('savePred').addEventListener('click', ()=> navigator.clipboard.writeText(`${res.point}x (conf ${res.conf}%)`) );
});

/* -------------------------
   Backtest quick demo
   ------------------------- */
document.getElementById('runBacktest').addEventListener('click', () => {
  const raw = document.getElementById('historyInput').value;
  const arrAll = parseHistory(raw);
  const out = document.getElementById('backtestOutput');
  if (arrAll.length < 100) { out.innerHTML = '<div class="small">paste at least 100 rounds for a decent quick backtest</div>'; return; }

  // simple backtest: sliding window predict next using combined strategy, measure "hit" if actual >= predicted*threshold
  const windowSize = parseInt(document.getElementById('windowSize').value,10) || 20;
  let wins = 0, total = 0;
  const thresholdMultiplier = 1.0; // consider prediction a correct "direction" if actual >= predicted * 1.0
  for (let i = windowSize; i < arrAll.length-1; i++) {
    const history = arrAll.slice(0, i); // use all up to i-1
    const recent = history.slice(-windowSize);
    const pred = predictCombined(history);
    const actual = arrAll[i];
    if (actual >= pred.point * thresholdMultiplier) wins++;
    total++;
  }
  const hitRate = total ? (wins/total) : 0;
  document.getElementById('avgPredAcc').innerText = (arrAll.reduce((a,b)=>a+b,0)/arrAll.length).toFixed(2) + 'x';
  document.getElementById('hitRate').innerText = (hitRate*100).toFixed(1) + '%';
  document.getElementById('sampleSize').innerText = total;
  out.innerHTML = `<div class="small">Backtest over ${total} predictions · hit when actual >= predicted. (This is a simple demo — tune thresholds & scoring to suit your goal.)</div>`;
});

