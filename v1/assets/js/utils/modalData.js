

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
                        <option value="default">Deep Space (Default)</option>
                        <option value="theme-violet">Tech Violet</option>
                        <option value="theme-mint">Neon Mint</option>
                        <option value="cool-metric">Cool Metric (Light)</option>
                        <option value="vapor-wave">Vapor Wave</option>
                    </select>
                </div>
            </div>
            <p class="text-secondary info">More themes coming soon...</p>
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
                    This application, the <span class="highlight"> Prediction Log Analyzer</span> helps you make informed decisions in crash games by analyzing past historical data.
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
}
};



export { modalContents };