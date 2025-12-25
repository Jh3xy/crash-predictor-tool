

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
};



export { modalContents };