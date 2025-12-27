

// =========================================================================
// ModalData.js: Centralized Modal Content Store
// =========================================================================
const modalContents = {
    'settings': {
        title: 'Application Settings',
        contentHTML: `
            <h4>Themes</h4>
            <p class="modal-desc">Customize your experience here. This could include theme switching, data limits, and more.</p>
            <div class="setting-item">
                <label for="theme-switch">Change Theme:</label>
                <div class="dropdown-container">
        <div class="dropdown" id="themeDropdown">
            <div class="dropdown-header">
                <span class="dropdown-header-text">
                    <span class="current-theme-indicator"></span>
                    Deep Space
                </span>
                <div class="dropdown-arrow"></div>
            </div>
                <div class="dropdown-list">
                    <div class="dropdown-item selected" data-theme="default" data-name="Deep Space">
                        <span class="theme-indicator" data-theme="default"></span>
                        Deep Space
                    </div>
                    <div class="dropdown-item" data-theme="cool-metric" data-name="Cool Metric">
                        <span class="theme-indicator" data-theme="cool-metric"></span>
                        Cool Metric
                    </div>
                    <div class="dropdown-item" data-theme="vapor-wave" data-name="Vapor Wave">
                        <span class="theme-indicator" data-theme="vapor-wave"></span>
                        Vapor Wave
                    </div>
                    <div class="dropdown-item" data-theme="theme-violet" data-name="Tech Violet">
                        <span class="theme-indicator" data-theme="theme-violet"></span>
                        Tech Violet
                    </div>
                    <div class="dropdown-item" data-theme="theme-mint" data-name="Neon Mint">
                        <span class="theme-indicator" data-theme="theme-mint"></span>
                        Neon Mint
                    </div>
                    <div class="dropdown-item" data-theme="theme-sunset" data-name="Sunset Drive">
                        <span class="theme-indicator" data-theme="theme-sunset"></span>
                        Sunset Drive
                    </div>
                    <div class="dropdown-item" data-theme="theme-forest" data-name="Forest Floor">
                        <span class="theme-indicator" data-theme="theme-forest"></span>
                        Forest Floor
                    </div>
                    <div class="dropdown-item" data-theme="theme-amber" data-name="Cyber Amber">
                        <span class="theme-indicator" data-theme="theme-amber"></span>
                        Cyber Amber
                    </div>
                    <div class="dropdown-item" data-theme="theme-latte" data-name="Soft Latte">
                        <span class="theme-indicator" data-theme="theme-latte"></span>
                        Soft Latte
                    </div>
                    <div class="dropdown-item" data-theme="theme-matrix" data-name="Matrix Code">
                        <span class="theme-indicator" data-theme="theme-matrix"></span>
                        Matrix Code
                    </div>
                    <div class="dropdown-item" data-theme="theme-royal" data-name="Royal Velvet">
                        <span class="theme-indicator" data-theme="theme-royal"></span>
                        Royal Velvet
                    </div>
                    <div class="dropdown-item" data-theme="theme-ice" data-name="Iceberg">
                        <span class="theme-indicator" data-theme="theme-ice"></span>
                        Iceberg
                    </div>
                    <div class="dropdown-item" data-theme="theme-hazard" data-name="Hazard">
                        <span class="theme-indicator" data-theme="theme-hazard"></span>
                        Hazard
                    </div>
                    <div class="dropdown-item" data-theme="theme-twilight" data-name="Lo-Fi Twilight">
                        <span class="theme-indicator" data-theme="theme-twilight"></span>
                        Lo-Fi Twilight
                    </div>
                    <div class="dropdown-item" data-theme="theme-monokai" data-name="Monokai Pro">
                        <span class="theme-indicator" data-theme="theme-monokai"></span>
                        Monokai Pro
                    </div>
                    <div class="dropdown-item" data-theme="theme-halcyon" data-name="Halcyon">
                        <span class="theme-indicator" data-theme="theme-halcyon"></span>
                        Halcyon
                    </div>
                    <div class="dropdown-item" data-theme="theme-atom" data-name="Atom One Dark">
                        <span class="theme-indicator" data-theme="theme-atom"></span>
                        Atom One Dark
                    </div>
                    <div class="dropdown-item" data-theme="theme-dracula" data-name="Dracula">
                        <span class="theme-indicator" data-theme="theme-dracula"></span>
                        Dracula
                    </div>
                    <div class="dropdown-item" data-theme="theme-dream" data-name="Dream City">
                        <span class="theme-indicator" data-theme="theme-dream"></span>
                        Dream City
                    </div>
                </div>
            </div>
        </div>
            </div>
            <p class="text-secondary info">More themes coming soon...</p>
        `
    },
    'integrity': {
        title: 'Prediction Tool Intergrity',
        contentHTML: `
            <h4>Integrity of the Prediction Model</h4>
            <p class="desc" style="margin-left: 1rem;">
                It is vital to understand that our Prediction Engine operates exclusively on historical data and statistical analysis, meaning <span class="highlight">it does not have access to the multiplier for the current, running round</span>, nor does it possess any proprietary information about the game's Random Number Generation (RNG) seed. </br> </br>The core CrashPredictor logic, which relies on calculating metrics like <span class="highlight">Volatility</span>, <span class="highlight">Long-Term Probabilities</span>, and <span class="highlight">Short-Term Trends</span> from the previous 200 completed rounds, is a form of technical analysis, similar to what is used in financial markets. </br>Therefore, every prediction generated is an educated guess based on observed patterns, not a guarantee or a breach of the game's mechanism. </br> </br>The model's success is measured by its accuracy in matching its prediction to the actual crash outcome after the round has finished, which is logged as the <span class="highlight">Win Rate</span> in your history.
            </p>
        `
    },
    'confirmation-template': {
        title: 'Confirm Action',
        contentHTML: `
            <p class="confirmation-message">Are you sure?</p>
            <div class="modal-footer">
                <button class="button-secondary cancel-btn">Cancel</button>
                <button class="button-primary confirm-btn">Confirm</button>
            </div>
        `
    },
    'card-info-total-predictions': {
        title: 'Total Predictions',
        contentHTML: `
            <p class="desc">
                This number shows how many times the prediction system has made a guess about the game's outcome since it started working. </br>  The number in green shows how many guesses it has made today.
            </p>
        `
    },
    'card-info-avg-accuracy': {
        title: 'Average Accuracy',
        contentHTML: `
            <p class="desc">
                This tells you how often the prediction system is correct. If the number is <span class="highlight"> 100&#37 </span>, it means every guess it has made has been perfect so far! The small number below shows how much better or worse the accuracy is this week.
            </p>
        `
    },
    'card-info-win-rate': {
        title: 'Win Rate (Last 24 Hours)',
        contentHTML: `
            <p class="desc">
                This is the percentage of successful predictions/sessions in the game. It shows how well it has been doing recently, specifically over the last 24 hours.
            </p>
        `
    },
    'card-info-active-sessions': {
        title: 'Active Sessions',
        contentHTML: `
            <p class="desc">
                This shows the count of completed prediction rounds tracked over the last 24 hours.</p>
                <p class="text-secondary">It indicates the volume of recent activity used to calculate the 24-hour Win Rate.
            </p>
        `
    },
    'user-guide': {
    title: 'Analyzer User Guide & Help',
    contentHTML: `
        <div class="user-guide-content modal-scroll-content">
            
            <section class="guide-section">
                <h3 class="section-title">App Overview / How to Use</h3>
                <p class="section-desc">
                    This application, the <span class="highlight"> Oracle </span> helps you make informed decisions in crash games by analyzing past 200 - 500 historical data. </br> This app analyzes crash games like BC.Game's. It's for stats, not guarantees—use responsibly.
                </p>

                <div class="feature-list">
                    <h4 class="feature-title">Main Screen Elements</h4>
                    <dl class="element-definitions">
                        <dt class="element-name">Last Crash Multiplier + Round ID</dt>
                        <dd class="element-description">Shows where the most <span class="highlight">recent completed round<span> crashed (e.g. 1.84x), plus its round ID. Updates every time a new round finishes. Great for seeing the latest game result at a glance.</dd>

                        <dt class="element-name">Recent Multipliers (10)</dt>
                        <dd class="element-description">A color-coded grid showing where the last 10 completed rounds crashed. Newest round is usually on the left.</dd>
                    

                        <dt class="element-name">Predict Button</dt>
                        <dd class="element-description">Click this button to get an AI prediction for the next upcoming round. It analyzes recent crash history and gives you a <span class="highlight">suggested cash-out point. </span> (Only works when enough historical data is loaded — usually 200+ rounds.)</dd>
                        
                        <dt class="element-name">Predicted Value</dt>
                        <dd class="element-description">The AI's suggested safe cash-out multiplier for the current/next round (e.g., 168x). This is where the model thinks you should cash out to have a good chance of winning based on past patterns.  </br> Lower values = more conservative/safer (higher win chance, smaller payout).  </br> Higher values = riskier (bigger potential win, but more chance of busting).</dd>
                        
                        <dt class="element-name">Confidence Bar</dt>
                        <dd class="element-description">A visual bar showing how confident the AI is in this prediction. </br> <span class="highlight">Higher bar / higher % </span> = stronger historical patterns supporting this number</br> <span class="highlight">Lower bar / lower % </span> = more uncertainty (market is volatile or patterns are unclear)  <span class="highlight">Use high-confidence predictions for safer bets — skip or bet small when confidence is low</span></dd>

                        <dt class="element-name">Info Icon (<i class="fa-solid fa-circle-info modal-icon"></i>)</dt>
                        <dd class="element-description">Click this small icon on any card or section to open a  <span class="highlight">quick explanation popup.</span> It tells you exactly what that part of the dashboard does, how the numbers are calculated, and tips for using it.</dd>
                    </dl>
                </div>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">Understanding Dashboard Statistics</h3>
                <p class="section-desc">
                    The dashboard provides key indicators (KPIs) to evaluate your prediction strategy's long-term performance.
                </p>
        
                <div class="feature-list">
                    <h4 class="feature-title">Key Metrics Explained</h4>
                    <dl class="element-definitions">
                        <dt class="element-name">Total Predictions</dt>
                        <dd class="element-description">The total number of times you've asked the AI for a prediction (all-time count) Includes a small <span class="highlight">+X today</span> counter showing how many predictions were made since midnight. This tracks your overall usage — more predictions give the AI more data to improve over time.</dd>
                        
                        <dt class="element-name">Avg. Prediction Accuracy</dt>
                        <dd class="element-description">Your all-time success rate across every prediction ever made. A prediction counts as a <span class="highlight">Success (100%)</span> if the actual crash multiplier was equal to or higher than the AI's predicted value (i.e., you would have won by cashing out at the suggested point). This is the big-picture view of how well the model has performed historically.</dd>
                        
                        <dt class="element-name">Win Rate (Last 24 Hours)</dt>
                        <dd class="element-description">The success rate only for <span class="highlight">predictions made in the last 24 hours.</span> </br> Calculated the same way: Success = Actual crash ≥ Predicted value. </br> This is your <span class="highlight">most important current performance indicator </span> — it shows how the AI is doing right now in today's market conditions.</dd>
                        
                        <dt class="element-name">Active Sessions</dt>
                        <dd class="element-description">The number of <span class="highlight">completed prediction rounds</span> (predictions that have finished with a known actual crash result) in the last 24 hours. </br> This count is used specifically to calculate your 24-hour Win Rate. </br> It resets daily and gives context for how many recent results are included in the current Win Rate number.</dd>
                    </dl>
                </div>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">History Log & Data Management</h3>
                <p class="section-desc">
                    This table keeps a record of every prediction you’ve made, so you can review what worked and what didn’t. </br>
                    It shows the time, predicted value, actual crash result, difference, and whether it was a win or loss. </br>
                    The log is limited to the last 50 entries for performance — older ones are automatically dropped. </br>
                </p>

                <div class="feature-list">
                    <h4 class="feature-title">Log Column Statuses</h4>
                    <ul class="status-list">
                        <li><span class="status-indicator pending-status">Pending</span>: The AI made a prediction, but the crash round is still running or hasn’t finished yet. Wait for the round to complete — the status will update automatically.</li>
                        <li><span class="status-indicator success-status">100% (Green)</span>: The actual crash multiplier was equal to or higher than the predicted value. You would have cashed out safely.</li>
                        <li><span class="status-indicator failure-status">0% (Red): Loss</span>: The actual crash multiplier was lower than the predicted value. The round busted early.</li>
                    </ul>
                </div>
                <span class="highlight"></span>
                        </br>
                <div class="data-action">
                    <h4 class="feature-title">Clearing History  <span class="highlight"> (Important!)</span></h4>
                    <p class="action-note">
                        Click the trash icon to delete all prediction records from the log. </br> A confirmation popup will appear — you must click Confirm to proceed. <span class="highlight">This action is permanent and cannot be undone. </span></br> Use this only when you want to start fresh (e.g., after testing a new strategy or if the log gets too long).</span>
                    </p>
                </div>
            </section>
        </div>
    `
},
'live-sync-detail': {
    title: 'Live Data Sync & Status',
    contentHTML: `
        <div class="sync-status-panel modal-scroll-content">
            
            <section class="status-summary">
                <h4 class="summary-title">Connection Status</h4>
                <div class="connection-state">
                    <span id="sync-status-dot" class="status-indicator"></span>
                    <p id="sync-status-message" class="status-text text-secondary">
                        Connecting to live feed...
                    </p>
                </div>
                <p class="explanation-text">
                    Live Sync provides real-time crash game data from BC.Game using a secure Cloudflare Worker and Durable Object. New rounds are fetched automatically every few seconds.
                </p>
            </section>

            <hr class="guide-separator">

            <section class="diagnostic-info">
                <h4 class="info-title">Current Status</h4>
                <div class="info-grid">
                    
                    <div class="info-item">
                        <label>Current Game ID:</label>
                        <span id="sync-game-id" class="data-value highlight-text">N/A</span>
                    </div>

                    <div class="info-item">
                        <label>Last Update:</label>
                        <span id="sync-last-time" class="data-value">--:--:--</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Rounds Loaded:</label>
                        <span id="sync-rounds-loaded" class="data-value">0</span>
                    </div>

                    <div class="info-item">
                        <label>WebSocket:</label>
                        <span id="sync-ws-status" class="data-value">Checking...</span>
                    </div>

                </div>
                <p class="text-secondary small-note" style="margin-top: 12px; font-size: 0.85rem;">
                    These values update automatically when you open this modal.
                </p>
            </section>

            <hr class="guide-separator">

            <section class="troubleshooting">
                <h4 class="info-title">Troubleshooting</h4>
                <p class="action-note text-secondary">
                    If data stops updating:
                    <br>• Refresh the page (most issues fix themselves)
                    <br>• Check your internet connection
                    <br>• The system auto-reconnects (may take 5–30 seconds)
                    <br>No manual "Force Refresh" is usually needed — everything recovers automatically.
                </p>
            </section>

            <div class="modal-footer-note">
                <small class="text-secondary">
                    Data is sourced from official BC.Game history API • Provably fair rounds are verified automatically
                </small>
            </div>
        </div>
    `
},
'verifier-status': {
    title: 'Round Verification Cryptography',
    contentHTML: `
        <div class="verifier-status-panel modal-scroll-content">
            
            <section class="status-summary">
                <h4 class="summary-title">Integrity Check Status</h4>
                <div class="connection-state">
                    <span id="verifier-status-dot" class="status-indicator"></span>
                    <p id="verifier-status-message" class="status-text text-secondary">
                        Awaiting round completion for verification...
                    </p>
                </div>
                
                <p class="explanation-text">
                    The Verifier confirms the integrity of the final crash multiplier using cryptographic hash data provided by the game server.
                </p>
            </section>

            <hr class="guide-separator">

            <section class="hash-details">
                <h4 class="info-title">Current Round Cryptographic Data</h4>
                <div class="info-grid hash-grid">
                    
                    <div class="info-item full-width">
                        <label>Game ID:</label>
                        <span id="verifier-game-id" class="data-value highlight-text">N/A</span>
                    </div>
                    
                    <div class="info-item full-width">
                        <label>Server Seed Hash (Pre-round):</label>
                        <span id="verifier-server-hash" class="data-value hash-value text-small">...waiting for hash...</span>
                    </div>

                    <div class="info-item full-width">
                        <label>Client Seed (User-Defined):</label>
                        <span id="verifier-client-seed" class="data-value hash-value text-small">...default seed...</span>
                    </div>
                    
                    <div class="info-item full-width">
                        <label>Verified Crash Multiplier:</label>
                        <span id="verifier-crash-result" class="data-value verified-text highlight-text">--</span>
                    </div>
                </div>
            </section>
            
            <hr class="guide-separator">
            
            <section class="action-controls">
                <h4 class="info-title">Verification Tools</h4>
                <button id="external-verifier-link" class="button-secondary wide-button">
                    <i class="fa-solid fa-link"></i> Use External Verifier Tool
                </button>
                <p class="action-note text-secondary">
                    Copy the cryptographic fields above into an external tool to manually confirm the integrity of the round.
                </p>
            </section>
        </div>
    `
},
'prediction-details': {
    title: 'Understanding Our Prediction Engine',
    contentHTML: `
        <p class="section-desc">
            This guide explains how our <span class="highlight">quantile-based prediction engine</span> works, what each output means, and how it helps you decide your next move.
        </p>

        <hr class="guide-separator">

        <div class="prediction-guide-content modal-scroll-content">
            <div class="integrity">
                <h3>Integrity of Prediction Model</h3>
                <p class="desc" style="margin-left: 1rem;">
                    Our Prediction Engine uses only historical crash data and statistical analysis. It has <span class="highlight">no access</span> to the current running multiplier or the game's RNG seed/future outcome.<br><br>
                    It performs technical analysis similar to financial markets: calculating volatility, probabilities, and recent trends from up to 500 previous completed rounds.<br><br>
                    Every prediction is a statistically educated estimate — never a guarantee. Success is measured after each round by comparing the actual crash to the predicted value (logged as Win Rate in your history).
                </p>
            </div>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">Your Four Key Metrics</h3>
                <p class="section-desc">
                    The engine outputs these four values to guide your decisions:
                </p>

                <dl class="element-definitions">
                    <dt class="element-name">1. Predicted Value</dt>
                    <dd class="element-description">
                        The recommended safe cash-out multiplier for the next round (e.g., 1.68x). 
                        This is the engine's best estimate for a balanced risk/reward point based on history.
                    </dd>
                    
                    <dt class="element-name">2. Confidence</dt>
                    <dd class="element-description">
                        <p>Shows how reliable the prediction is (0–100%).</p>
                        <p class="action-note">
                            Higher confidence = stronger historical patterns and lower current market chaos.<br>
                            Lower confidence = high volatility or unusual recent streaks — treat prediction with more caution.
                        </p>
                    </dd>

                    <dt class="element-name">3. Risk Level</dt>
                    <dd class="element-description">
                        <p>Quick summary of current market mood:</p>
                        <div class="risk-grid pattern-grid">
                            <span class="grid-header">Risk Level</span>
                            <span class="grid-header">Meaning</span>
                            <span class="grid-header">Suggested Action</span>
                            
                            <span class="status-indicator success-status pattern-name">Low</span>
                            <span class="pattern-condition">Stable patterns, predictable distribution</span>
                            <span class="model-action">Prediction is likely reliable — good time to follow it.</span>
                            
                            <span class="status-indicator pending-status pattern-name">Medium</span>
                            <span class="pattern-condition">Moderate swings or emerging streaks</span>
                            <span class="model-action">Proceed carefully — consider cashing out slightly earlier.</span>
                            
                            <span class="status-indicator failure-status pattern-name">High</span>
                            <span class="pattern-condition">Extreme volatility or long bust streaks</span>
                            <span class="model-action">Accuracy drops — consider skipping the round or betting very small.</span>
                        </div>
                    </dd>

                    <dt class="element-name">4. Volatility</dt>
                    <dd class="element-description">
                        <p>Measures how much crash multipliers vary recently (standard deviation of last ~200–500 rounds).</p>
                        <p class="action-note text-secondary">
                            High volatility (> ~2.0) → market is wild → predictions become more conservative to stay safe.
                        </p>
                    </dd>
                </dl>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">How the Prediction Is Made</h3>
                <p class="section-desc">
                    The engine combines long-term statistics with short-term pattern detection.
                </p>

                <h4>Step 1: Long-Term Baseline (Quantile Statistics)</h4>
                <p class="section-desc">
                    Analyzes up to 500 previous rounds to find a safe statistical target (default: ~40th percentile with house edge adjustment).
                </p>

                <h4>Step 2: Short-Term Pattern Overrides</h4>
                <p class="section-desc">
                    Checks the last 7–10 rounds for strong signals that can adjust the baseline prediction:
                </p>

                <div class="pattern-grid">
                    <span class="grid-header">Pattern</span>
                    <span class="grid-header">Condition</span>
                    <span class="grid-header">Adjustment</span>
                    
                    <span class="pattern-name">Long Bust Streak</span>
                    <span class="pattern-condition">Many recent low crashes (e.g., <1.5x)</span>
                    <span class="model-action">Boosts prediction (expects streak to break)</span>
                    
                    <span class="pattern-name">After Big Spike</span>
                    <span class="pattern-condition">Last round ≥5x or recent ≥10x</span>
                    <span class="model-action">Lowers prediction significantly (expects cooldown)</span>
                    
                    <span class="pattern-name">Other Trends</span>
                    <span class="pattern-condition">CUSUM or other enabled features detect shifts</span>
                    <span class="model-action">Further refines prediction up/down</span>
                </div>

                <p class="action-note">
                    Additional features (toggleable in code) like CUSUM detection, house edge blending, and winsorization can fine-tune behavior further.
                </p>
            </section>
        </div>
    `
},
'roadmap': {
    title: 'Oracle AI Roadmap v3.1 - Aggressive Caution Edits',
    contentHTML: `
        <div class="user-guide-content modal-scroll-content">
         <h3 class="section-title">ORACLE AI ROADMAP v3.0</h3>
         </br>
            <section class="guide-section">
                <h4>Summary</h4>
                <ul class="">
                    <li><a href="#phase-1" style="font-size: .8rem; text-decoration: underline; text-decoration-color: var(--color-accent-primary); cursor: pointer; color: var(--text-primary); display: block;">Phase 1</a></li>
                    <li><a href="#phase-2" style="font-size: .8rem; text-decoration: underline; text-decoration-color: var(--color-accent-primary); cursor: pointer; color: var(--text-primary); display: block;">Phase 2</a></li>
                    <li><a href="#phase-3" style="font-size: .8rem; text-decoration: underline; text-decoration-color: var(--color-accent-primary); cursor: pointer; color: var(--text-primary); display: block;">Phase 3</a></li>
                    <li><a href="#phase-4" style="font-size: .8rem; text-decoration: underline; text-decoration-color: var(--color-accent-primary); cursor: pointer; color: var(--text-primary); display: block;">Phase 4</a></li>
                    <li><a href="#phase-5" style="font-size: .8rem; text-decoration: underline; text-decoration-color: var(--color-accent-primary); cursor: pointer; color: var(--text-primary); display: block;">Phase 5</a></li>
                </ul>
            </section>
            </br>
            </br>
            <section class="guide-section">
                <p class="section-desc"><strong>Final Oracle Prediction Engine Roadmap (v3.0 - Refined & Actionable)</strong> </br> Check off phases with ✅ as you complete them!</p>
                <p class="section-desc">Hey! First off, solid draft—it's well-structured with phases, code pseudos, tests, and toggles, which makes it practical. I've combined/contrasted it with my preliminary outline: Kept your quick wins (Phase 1) and pattern smarts (Phase 2), trimmed potential over-engineering (e.g., emotional analogs → simplified to streak-based tilt avoidance; skipped volume if no API data proves correlation), added my suggestions for bolder preds (e.g., min 1.3x floor, ARIMA for trends), and emphasized ROI alongside accuracy (via Kelly integration in tests). Phases are shorter/tighter, with strict decision gates to avoid bloat. Total timeline: 2-3 weeks max.</p>
                <p class="section-desc">On the "impossible" 90%: You're spot on—true RNG makes >80% unrealistic without leaving edge (e.g., bolder >2x preds drop accuracy but boost ROI via fewer bets/higher payouts). We'll aim for 80-85% accuracy with avg targets 1.5-3x (realistic lift: +5-10% from baseline), prioritizing ROI >50% in backtests. If it plateaus, pivot to live A/B.</p>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">Handling TF.js Heaviness & Data Needs (Before LSTM Phase)</h3>
                <p class="section-desc">TensorFlow.js is browser-friendly but can be heavy (100-500ms inference, 5-20min training on CPU). Here's tailored advice to make it viable without killing perf:</p>

                <h4>For Heaviness/Performance:</h4>
                </br>
                <ul>
                    <li><strong>Lazy Load TF.js</strong>: Only import on "AI Mode" toggle.</li>
                    <pre><code class="language-javascript">// In predictor.js or script.js
    async function enableLSTM() {
    if (!window.tf) {
        await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
        });
    }
    // Then init model
    }</code></pre>
                        </br>
                    <li><strong>Web Workers for Background</strong>: Run training/inference off main thread.</li>
    <pre><code class="language-javascript">// ml-worker.js
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js');
        self.onmessage = async (e) => {
        const { action, data } = e.data;
        if (action === 'train') {
            // Train logic here
            self.postMessage({ result: trainedModel });
        } else if (action === 'predict') {
            const model = await tf.loadLayersModel('indexeddb://crash-lstm');
            const pred = model.predict(tf.tensor2d([data.history], [1, 50, 1]));
            self.postMessage({ pred: pred.dataSync()[0] });
        }
        };</code></pre>
                        </br>
                    <li><strong>Model Optimization</strong>: Smaller LSTM (32/16 units) + quantization (2-byte weights).</li>
                    <li><strong>Batching & Early Stopping</strong>: Batches of 32; stop if val_loss no improvement for 3 epochs.</li>
                    <li><strong>Browser Compat</strong>: Chrome/Edge/Firefox; reduce layers on mobile.</li>
                    <li><strong>Fallback</strong>: Disable via toggle, fall back to quantile.</li>
                </ul>
    </br>
                <h4>For 1000+ Rounds Data Needed:</h4>
                <ul>
                    <li><strong>Accumulate Gradually</strong>: Use DataStore.rounds (caps at 500-2000).</li>
                    <li><strong>Bulk Fetch</strong>: Extend crash-oracle-do.js to pull 5000+ via API.</li>
                    <li><strong>Downsample/Preprocess</strong>: Normalize (log-scale), use every 2nd round if >10k.</li>
                    <li><strong>Offline Train Option</strong>: Train in Node.js, convert to TF.js format.</li>
                    <pre><code class="language-bash"># In terminal: npm init -y; npm i @tensorflow/tfjs-node
# Then script similar to your pseudocode, save as tfjs_model.save('file:///path/to/model');
# Convert: tensorflowjs_converter --input_format=tf_saved_model /path/to/model /path/to/tfjs_model</code></pre>
                    <li><strong>Progressive Training</strong>: Train on 500 first, fine-tune with new batches.</li>
                </ul>
                <p class="section-desc">This keeps it lightweight—expect <200ms preds, 2-5min trains on 1000 rounds.</p>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">Unified Implementation Roadmap</h3>
                <p class="section-desc"><strong>Target Metrics</strong>: 80-85% accuracy, ROI >60%, avg target 1.5-3x.</p>
                <p class="section-desc"><strong>Testing Protocol (Per Feature/Phase)</strong>:</p>
                <ol>
                    <li>Isolated: tester.runIncrementalTest(100) – >2% accuracy + >5% ROI lift.</li>
                    <li>Full: backtester.runBacktest(200) – Check distribution, edge cases.</li>
                    <li>Diagnostic: diagnostic.runDiagnostics() – Verify "working: true".</li>
                    <li>A/B: backtester.compareFeatures({baseline}, {new}) – No regression.</li>
                    <li>Live: 50 manual preds; track in HistoryLog.</li>
                </ol>
            </section>

            <hr class="guide-separator">

            <section class="guide-section" id="phase-1">
                <h3 class="section-title">Phase 1: Quick Wins (1-2 Days) ✅</h3>
                <p class="section-desc">Focus: Address conservatism with boosts/reductions. Estimated: 76-80% accuracy.</p>
                <ul>
                    <li>1.1 <strong>✅Post-Moon Caution</strong> (High Priority)</li>
                    <li>1.2 <strong>✅Enhanced Streak Analyzer</strong> (Boosts for rebound, min 1.3x floor)</li>
                    <li>1.3 <strong>Real-Time Confidence UI Scaling</strong></li>
                </ul>
                <p class="section-desc"><strong>Gate</strong>: If <3% combined lift, stop & debug data.</p>
            </section>

            <section class="guide-section" id="phase-2">
                <h3 class="section-title">Phase 2: Pattern Intelligence (3-5 Days)</h3>
                <p class="section-desc">Add context for bolder, fluid preds. Estimated: 80-83%.</p>
                <ul>
                    <li>2.1 <strong>Cycle Detection</strong></li>
                    <li>2.2 <strong>Dynamic Threshold Tuning</strong></li>
                    <li>2.3 <strong>Simple ARIMA Blend</strong></li>
                </ul>
                <p class="section-desc"><strong>Gate</strong>: If <80%, skip Phase 3; refine Phase 1-2.</p>
            </section>

            <section class="guide-section" id="phase-3">
                <h3 class="section-title">Phase 3: Advanced Enhancements (4-6 Days)</h3>
                <p class="section-desc">Hybrid rules + auto-tune. Estimated: 83-85%.</p>
                <ul>
                    <li>3.1 <strong>Hybrid Weighting</strong></li>
                    <li>3.2 <strong>Auto-Calibration</strong></li>
                </ul>
                <p class="section-desc"><strong>Gate</strong>: If ROI <60%, pivot to live data collection.</p>
            </section>

            <section class="guide-section" id="phase-4">
                <h3 class="section-title">Phase 4: Polish & Optimization (Ongoing)</h3>
                <ul>
                    <li>Overfit Prevention</li>
                    <li>Kelly ROI Focus</li>
                    <li>Toggles</li>
                    <li>Metrics</li>
                </ul>
                <p class="section-desc"><strong>Gate</strong>: At 85%, decide on LSTM (skip if perf concerns).</p>
            </section>

            <section class="guide-section" id="phase-5">
                <h3 class="section-title">Phase 5: Deep Learning (LSTM with TF.js) (5-8 Days)</h3>
                <p class="section-desc">"God Mode" for non-linear patterns. Estimated: 85-88% (if data/perf allow). Only if prior phases hit 80%.</p>
                <ul>
                    <li>5.1 <strong>LSTM Setup</strong></li>
                </ul>
            </section>

            <hr class="guide-separator">

            <div class="modal-footer-note">
                <small class="text-secondary">Update this file with ✅ for completed steps! Next action: Implement Phase 1 in VS Code; run tests.</small>
            </div>
        </div>
    `
},
'chart-info': {
    title: 'Performance Index',
    contentHTML: `
        <h3 class="section-title">Performance Index</h3>
        <p class="section-desc">
            This chart tracks how accurate and profitable your predictions have been over time.
        </p>

        <dl class="element-definitions">
            <dt class="element-name">The Chart</dt>
            <dd class="element-description">
                A line graph showing your cumulative % growth from following the AI predictions.  
                Up/green = winning more than losing. Down/red = more losses recently.
            </dd>

            <dt class="element-name">Net Growth</dt>
            <dd class="element-description">
                Your total % change overall (e.g., +12.50% means you're up 12.50% if you cashed out at every predicted value).  
                This is your big-picture result.
            </dd>

            <dt class="element-name">Avg. Return</dt>
            <dd class="element-description">
                Average % gain/loss per prediction (Net Growth ÷ number of results).  
                Example: +0.25% means each prediction added 0.25% on average.
            </dd>
        </dl>

        <p class="action-note text-secondary">
            Tip: Aim for steady positive growth over 50+ predictions. If it goes negative, try resetting history or testing new engine features.
        </p>
    `
}
};



export { modalContents };