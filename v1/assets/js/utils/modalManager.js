


// =========================================================================
// ModalManager.js: Reusable, Data-Driven Modal System
// =========================================================================

// Global elements
const BODY = document.body;
let currentModal = null; // Variable to hold the modal element
let elementThatOpenedModal = null; // Variable to restore focus later

// 1. Data Dictionary for Modal Content
const modalContents = {
    // --- SETTINGS ---
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
    // --- CONFIRMATION (REUSABLE TEMPLATE) ---
    'confirmation-template': {
        title: 'Confirm Action',
        // NOTE: The Confirmation function builds the final HTML dynamically
        contentHTML: `
            <p class="confirmation-message">Are you sure?</p>
            <div class="modal-footer">
                <button class="button-secondary cancel-btn">Cancel</button>
                <button class="button-primary confirm-btn">Confirm</button>
            </div>
        `
    },
    // --- DASHBOARD CARDS (Data Documentation) ---
    'card-info-total-predictions': {
        title: 'Total Predictions Explained',
        contentHTML: `
            <p>This is the cumulative count of every round where a prediction was generated, including both completed and pending rounds.</p>
            <p class="text-secondary">It represents the lifetime usage of the prediction algorithm.</p>
        `
    },
    'card-info-avg-accuracy': {
        title: 'Average Prediction Accuracy',
        contentHTML: `
            <p>This metric shows the **Overall Success Rate** (All Time) of the predictions.</p>
            <p>A prediction is counted as successful (100%) if the <strong>Actual Crash Value is strictly greater than the Predicted Value</strong>.</p>
        `
    },
    'card-info-win-rate': {
        title: 'Win Rate (Last 24 Hours)',
        contentHTML: `
            <p>This is the percentage of successful predictions within the last 24-hour window.</p>
            <p>It is the most relevant metric for evaluating current prediction strategy performance.</p>
        `
    },
    'card-info-active-sessions': {
        title: 'Active Sessions',
        contentHTML: `
            <p>This shows the count of completed prediction rounds tracked over the last 24 hours.</p>
            <p class="text-secondary">It indicates the volume of recent activity used to calculate the 24-hour Win Rate.</p>
        `
    }
    // 🔥 NEW: Add the live-sync-detail entry here later!
};


/**
 * Removes the current modal and cleans up the body class.
 */
function closeModal() {
    if (currentModal) {
        BODY.removeChild(currentModal);
        BODY.classList.remove('modal-open');
        currentModal = null;
        
        // Restore focus to the element that opened the modal (good for A11Y)
        if (elementThatOpenedModal) {
            elementThatOpenedModal.focus();
            elementThatOpenedModal = null;
        }
    }
}


/**
 * Creates, populates, and displays the modal based on the clicked element's data-id.
 * @param {string} dataId - The key corresponding to an entry in modalContents.
 */
function populateAndShowModal(dataId) {
    const content = modalContents[dataId];

    if (!content) {
        console.error(`ModalManager: No content found for ID: ${dataId}`);
        return;
    }
    
    // 1. Cleanup and Store Focus
    if (currentModal) {
        closeModal();
    }
    elementThatOpenedModal = document.activeElement; // Store the focused element

    // 2. Create Modal Structure
    const modal = document.createElement('div');
    modal.classList.add('app-modal'); 
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
        <div class="modal-header">
            <h3>${content.title}</h3>
            <button class="close-modal" aria-label="Close Modal"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="modal-body">
            ${content.contentHTML}
        </div>
    `;

    // 3. Attach Close Listener
    modal.querySelector('.close-modal').addEventListener('click', closeModal);

    // 4. Show Modal and Apply Classes
    BODY.classList.add('modal-open'); 
    BODY.appendChild(modal);
    currentModal = modal;
    
    // Set initial focus to the close button
    modal.querySelector('.close-modal').focus();
}


/**
 * Creates and displays a generic confirmation modal.
 * @param {string} title - The specific title (e.g., "Clear History").
 * @param {string} message - The confirmation question (e.g., "Are you sure?").
 * @param {function} callbackFunction - The function to execute if the user clicks 'Confirm'.
 */
function createConfirmationModal(title, message, callbackFunction) {
    // 1. We don't use the templateContent variable from the previous draft, 
    //    as the content is now hardcoded below and that variable was unused.
    
    // 2. Cleanup and Store Focus
    if (currentModal) { closeModal(); }
    elementThatOpenedModal = document.activeElement; 


    // 3. Create Modal Structure
    const modal = document.createElement('div');
    modal.classList.add('app-modal', 'confirmation-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    // Inject the final HTML, using template strings for dynamic content
    modal.innerHTML = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="close-modal" aria-label="Cancel"><i class="fa-solid fa-x"></i></button>
        </div>
        <div class="modal-body">
            <p>${message}</p>
        </div>
        <div class="modal-footer">
            <button class="button-secondary cancel-btn">Cancel</button>
            <button class="button-primary confirm-btn">Confirm</button>
        </div>
    `;

    // 4. Attach Listeners
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.cancel-btn').addEventListener('click', closeModal);

    // CRUCIAL: The Confirm button executes the passed-in function
    modal.querySelector('.confirm-btn').addEventListener('click', () => {
        callbackFunction(); 
        closeModal();
    });

    // 5. Show Modal and Focus
    BODY.classList.add('modal-open');
    BODY.appendChild(modal);
    currentModal = modal;
    
    modal.querySelector('.cancel-btn').focus();
}


// Global listener for ESC key to close modal (good for accessibility)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentModal) {
        closeModal();
    }
});

// --- EXPORTS ---
export { populateAndShowModal, closeModal, createConfirmationModal };
