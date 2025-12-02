
// Manage Creation and Display of Modals

// =========================================================================
// ModalManager.js: Reusable, Data-Driven Modal System
// =========================================================================

// 1. Data Dictionary for Modal Content
// Use data-id of the clicked element as the key
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
};

const BODY = document.body;
let currentModal = null; // Variable to hold the modal element

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
    
    // 1. If a modal already exists, remove it first
    if (currentModal) {
        closeModal();
    }

    // 2. Create Modal Structure (using a <dialog> element for accessibility)
    const modal = document.createElement('div');
    modal.classList.add('app-modal'); 
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

    // 4. Show Modal and Apply Blur Effect
    BODY.classList.add('modal-open'); // This triggers your CSS blur/pointer-events
    BODY.appendChild(modal);
    currentModal = modal;
    
    // Optional: Add event listener to close when clicking outside the modal
    // modal.addEventListener('click', (e) => {
    //     if (e.target === modal) {
    //         closeModal();
    //     }
    // });
}

/**
 * Removes the current modal and cleans up the body class.
 */
function closeModal() {
    if (currentModal) {
        BODY.removeChild(currentModal);
        BODY.classList.remove('modal-open');
        currentModal = null;
    }
}

// Global listener for ESC key to close modal (good for accessibility)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentModal) {
        closeModal();
    }
});


export { populateAndShowModal, closeModal };
