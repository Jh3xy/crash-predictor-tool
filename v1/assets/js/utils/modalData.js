

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
                <div class="select-wrapper">
                    <select id="theme-switch">
                        <option value="default" class="dropdown-option is-active" data-theme-id="default">Deep Space (Default)</option>
                        <option value="theme-violet" class="dropdown-option" data-theme-id="theme-violet">Tech Violet</option>
                        <option value="theme-mint" class="dropdown-option" data-theme-id="theme-mint">Neon Mint</option>
                        <option value="cool-metric" class="dropdown-option" data-theme-id="cool-metric">Cool Metric (Light)</option>
                        <option value="vapor-wave" class="dropdown-option" data-theme-id="vapor-wave">Vapor Wave</option>
                    </select>
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
                <h3 class="section-title">App Overview & The Core Loop</h3>
                <p class="section-desc">
                    This application, the <span class="highlight"> Oracle </span> helps you make informed decisions in crash games by analyzing past historical data.
                </p>

                <div class="feature-list">
                    <h4 class="feature-title">Main Screen Elements</h4>
                    <dl class="element-definitions">
                        <dt class="element-name">Current Multiplier</dt>
                        <dd class="element-description">The live multiplier (e.g., <span class="highlight">1.55x</span>) as the round is running.</dd>
                        
                        <dt class="element-name">Predict Button</dt>
                        <dd class="element-description">Click this to request a prediction for the <strong>next round</strong>. It will show a loading state during analysis.</dd>
                        
                        <dt class="element-name">Predicted Value</dt>
                        <dd class="element-description">The suggested safe cash-out point (e.g., <span class="highlight">1.25x</span>) for the round being analyzed.</dd>
                        
                        <dt class="element-name">Confidence Bar</dt>
                        <dd class="element-description">A visual representation of the algorithm's certainty. <span class="highlight">Higher confidence is better.</span></dd>

                        <dt class="element-name">Info Icon (<i class="fa-solid fa-circle-info modal-icon"></i>)</dt>
                        <dd class="element-description">This icon provides futher info on the detials and functionailty of each card when clicked</dd>
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
                        <dd class="element-description">Your cumulative usage of the predictor. Includes the <span class="highlight"> +X today </span>counter showing activity since midnight.</dd>
                        
                        <dt class="element-name">Avg. Prediction Accuracy</dt>
                        <dd class="element-description">The all-time success rate. A prediction is a <strong>Success <span class="highlight"> 100&#37 </span> </strong> if the <span class="highlight">Actual Crash Value > Predicted Value</span>.</dd>
                        
                        <dt class="element-name">Win Rate (Last 24 Hours)</dt>
                        <dd class="element-description">The success rate based only on predictions made in the last 24 hours. This is your most <span class="highlight">relevant metric for current performance.</span></dd>
                        
                        <dt class="element-name">Active Sessions</dt>
                        <dd class="element-description">The count of completed prediction rounds tracked over the last 24 hours, used to calculate the 24-hour Win Rate.</dd>
                    </dl>
                </div>
            </section>

            <hr class="guide-separator">

            <section class="guide-section">
                <h3 class="section-title">History Log & Data Management</h3>
                <p class="section-desc">
                    The History Log records every prediction for transparent strategy review.
                </p>

                <div class="feature-list">
                    <h4 class="feature-title">Log Column Statuses</h4>
                    <ul class="status-list">
                        <li><span class="status-indicator pending-status">Pending</span>: The prediction was made, but the round hasn't finished yet.</li>
                        <li><span class="status-indicator success-status">100% (Green)</span>: Your prediction was successful ("Actual > Predicted").</li>
                        <li><span class="status-indicator failure-status">0% (Red)</span>: Your prediction failed ("Actual <= Predicted").</li>
                    </ul>
                </div>

                <div class="data-action">
                    <h4 class="feature-title">Clearing History  <span class="highlight"> (Important!)</span></h4>
                    <p class="action-note">
                        When you click "Clear History," a Confirmation Pop-up will appear. This is a safety step. You must click <span class="highlight"> Confirm </span> in the modal to permanently delete all stored data. <span class="highlight"> This action is irreversible. </span>
                    </p>
                </div>
            </section>
        </div>
    `
},
'live-sync-detail': {
    title: 'Live Data Synchronization Status',
    contentHTML: `
        <div class="sync-status-panel modal-scroll-content">
            
            <section class="status-summary">
                <div class="flex-wrap">
                <h4 class="summary-title">Connection Status</h4>
                <div class="connection-state">
                    <span id="sync-status-dot" class="status-indicator"></span>
                    <p id="sync-status-message" class="status-text text-secondary">
                        Awaiting initial connection...
                    </p>
                </div>
                </div>
                
                <p class="explanation-text">
                    Live Sync maintains a real-time connection to the game server to ensure the prediction algorithm always uses the freshest data.
                </p>
            </section>

            <hr class="guide-separator">

            <section class="live-data-view">
                <h4 class="summary-title">Live Multiplier</h4>
                <div id="live-sync-current-multiplier-wrapper" class="multiplier-display">
                    <span id="live-sync-current-multiplier" class="current-multiplier-value highlight">1.00x</span>
                </div>
            </section>

            <hr class="guide-separator">

            <section class="diagnostic-info">
                <h4 class="info-title">Real-Time Diagnostics</h4>
                <div class="info-grid">
                    
                    <div class="info-item">
                        <label>Current Game ID:</label>
                        <span id="sync-game-id" class="data-value highlight-text">N/A</span>
                    </div>

                    <div class="info-item">
                        <label>Last Sync Time:</label>
                        <span id="sync-last-time" class="data-value">--:--:--</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Reported Latency:</label>
                        <span id="sync-latency" class="data-value">0ms</span>
                    </div>

                    <div class="info-item">
                        <label>Verification Check:</label>
                        <span id="sync-verification" class="data-value verified-text">Active</span>
                    </div>

                </div>
            </section>
            
            <hr class="guide-separator">
            
            <section class="control-actions">
                <div class="flex-wrap">
                    <h4 class="info-title">Connection Control</h4>
                    <button id="force-refresh-btn" class="button-secondary wide-button">
                        <i class="fa-solid fa-arrows-rotate"></i> Force Refresh Connection
                    </button>
                </div>
                <p class="action-note text-secondary">
                    Use this button if data seems stale or the status is stuck on "Reconnecting."
                </p>
            </section>
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
                This guide breaks down exactly how our <span class="highlight">hybrid prediction system</span> works and what each output means for your next move.
            </p>

            <hr class="guide-separator">

            <div class="prediction-guide-content modal-scroll-content">
                <div class="integrity">
                    <h3>Integrity of Prediction Model</h3>
                    <p class="desc" style="margin-left: 1rem;">
                        It is vital to understand that our Prediction Engine operates exclusively on historical data and statistical analysis, meaning <span class="highlight">it does not have access to the multiplier for the current, running round</span>, nor does it possess any proprietary information about the game's Random Number Generation (RNG) seed. </br> </br>The core CrashPredictor logic, which relies on calculating metrics like <span class="highlight">Volatility</span>, <span class="highlight">Long-Term Probabilities</span>, and <span class="highlight">Short-Term Trends</span> from the previous 200 completed rounds, is a form of technical analysis, similar to what is used in financial markets. </br>Therefore, every prediction generated is an educated guess based on observed patterns, not a guarantee or a breach of the game's mechanism. </br> </br>The model's success is measured by its accuracy in matching its prediction to the actual crash outcome after the round has finished, which is logged as the <span class="highlight">Win Rate</span> in your history.
                    </p>
                </div>

                <hr class="guide-separator">

                <section class="guide-section">
                    <h3 class="section-title">Your Four Key Metrics</h3>
                    <p class="section-desc">
                        Our model provides these four crucial values to help you decide when and how much to bet:
                    </p>

                    <dl class="element-definitions">
                        <dt class="element-name">1. Predicted Value - <span class="highlight">The Prediction Target</span></dt>
                        <dd class="element-description">
                            This is the final, calculated multiplier that the model recommends you aim for. It's the system's best guess for a safe cash-out point in the next round.
                        </dd>
                        
                        <dt class="element-name">2. Confidence</dt>
                        <dd class="element-description">
                            <p>This number shows how <span class="highlight">certain</span> the model is about its Predicted Value.</p>
                            <p class="action-note">
                                <span class="highlight">How it Works: </span> The confidence value start at 50% confidence. We then gain points if we have a lot of historical data <span class="highlight"> i.e.  up to 200 rounds </span> and lose points if the data is highly volatile or if our internal Risk Score is high.
                            </p>
                            <p class="action-note text-secondary">
                                <span class="highlight">Action</span> Higher confidence suggests the market is following recognizable patterns. Lower confidence suggests chaos, making any prediction a riskier choice.
                            </p>
                        </dd>

                        <dt class="element-name">3. Risk Level - <span class="highlight">The Market Environment</span></dt>
                        <dd class="element-description">
                            <p>This is the simplest, most actionable metric. It tells you the general market mood based on recent data patterns.</p>
                            
                            <div class="risk-grid pattern-grid">
                                <span class="grid-header">Risk Level</span>
                                <span class="grid-header">Meaning</span>
                                <span class="grid-header">Suggested Strategy</span>
                                
                                <span class="status-indicator success-status pattern-name">Low</span>
                                <span class="pattern-condition">The market is stable, with predictable distribution patterns.</span>
                                <span class="model-action">The Predicted Value is likely<span class="highlight"> Reliable </span>.</span>
                                
                                <span class="status-indicator pending-status pattern-name">Medium</span>
                                <span class="pattern-condition">Moderate volatility or some concerning streaks are emerging.</span>
                                <span class="model-action"><span class="highlight">Proceed with caution</span>; consider aiming slightly lower than the prediction.</span>
                                
                                <span class="status-indicator failure-status pattern-name">High</span>
                                <span class="pattern-condition">Extreme volatility, prolonged low streaks, or recent large spikes.</span>
                                <span class="model-action">Model accuracy is reduced. <span class="highlight"> Consider skipping the round </span>.</span>
                            </div>
                        </dd>

                        <dt class="element-name">4. Volatility - <span class="highlight">How Wild is the Market?</span></dt>
                        <dd class="element-description">
                            <p>Volatility measures how unpredictable the crash multipliers have been recently. A high number here means the results are spread far apart—you might see a 1.01x followed by a 15.00x.</p>
                            <p>
                                <span class="highlight">Calculation: </span> We use the Standard Deviation ($\sigma$) of the last 200 rounds.
                            </p>
                            <div class="formula-block">
                                <label>Formula:</label>
                                $$ \sigma = \sqrt{\frac{\sum_{i=1}^{N} (x_i - \mu)^2}{N}} $$
                                <p class="text-secondary">
                                    This math just finds the average distance of every crash value ($x_i$) from the overall average ($\mu$).
                                </p>
                            </div>
                            <p class="action-note text-secondary">
                                <span class="highlight">Action: </span> If Volatility is high (above 2.0), the model generally lowers its prediction, as high volatility makes big spikes less likely to repeat immediately.
                            </p>
                        </dd>
                    </dl>
                </section>

                <hr class="guide-separator">

                <section class="guide-section">
                    <h3 class="section-title">Behind the Prediction: The Two-Step Analysis</h3>
                    <p class="section-desc">
                        The model calculates the Predicted Value by balancing long-term statistics and short-term trends.
                    </p>

                    <h4>Step 1: Long-Term Probability <span class="highlight">The Statistical Baseline </span></h4>
                    <p class="section-desc">
                        The model looks at up to <span class="highlight">200 previous rounds </span> to determine the average crash amount for different zones:
                    </p>

                    <dl class="zone-definitions">
                        <dt class="element-name">Low Zone</dt>
                        <dd class="element-description">Multiplier Range: Below 2.00x / Purpose in Model: Determines the baseline if the market is trending low.</dd>
                        <dt class="element-name">Medium Zone</dt>
                        <dd class="element-description">Multiplier Range: 2.00x to 10.00x / Purpose in Model: Determines the baseline if the market is trending higher.</dd>
                    </dl>
                    <p class="action-note text-secondary">
                        <span class="highlight">Logic</span> The model figures out which zone has the highest probability. If the Medium Zone is more probable than the Low Zone, the base prediction starts higher.
                    </p>

                    <h4>Step 2: Short-Term Pattern Recognition (The Rules)</h4>
                    <p class="section-desc">
                        The model specifically examines the <span class="highlight">last 7 rounds </span> for critical patterns that indicate an immediate shift. These patterns <span class="highlight">override</span> the statistical baseline if detected:
                    </p>

                    <div class="pattern-grid">
                        <span class="grid-header">Pattern Detected</span>
                        <span class="grid-header">Condition (What happened in the last 7 rounds)</span>
                        <span class="grid-header">Model's Immediate Action</span>
                        
                        <span class="pattern-name">Low Streak</span>
                        <span class="pattern-condition"><span class="highlight">5 or more rounds </span>crashed below 2.00x.</span>
                        <span class="model-action">The model predicts a break in the streak, **boosting** the predicted value to above 1.90x.</span>
                        
                        <span class="pattern-name">Spike Cooldown</span>
                        <span class="pattern-condition">The very last round crashed at or above <span class="highlight">5.00x </span>.</span>
                        <span class="model-action">The model forces a <span class="highlight">low</span> prediction ($\le 1.40x$), expecting a low payout after a massive spike.</span>
                        
                        <span class="pattern-name">Spike Recovery</span>
                        <span class="pattern-condition">A high multiplier ($\ge 10.00x$) was recently hit.</span>
                        <span class="model-action">The model <span class="highlight">moderately boosts</span> the prediction, anticipating a steady recovery phase.</span>
                    </div>

                    <p class="action-note">
                        This hybrid approach ensures the prediction is both statistically grounded and reactive to immediate, high-impact market changes.
                    </p>
                </section>
            </div>
        `
    }
};



export { modalContents };