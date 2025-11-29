/**
 * js/EventEmitter.js
 * Implements a simple, decoupled Event Bus for the application.
 * Modules register listeners via .on() and trigger events via .emit().
 */

export class EventEmitter {
    constructor() {
        // The core object to hold all event names and their associated listener functions
        this.listeners = {};
        console.log('🔗 EventEmitter: Initialized and ready to manage application events.');
    }

    /**
     * Registers a callback function to be executed when a specific event is emitted.
     * @param {string} eventName - The name of the event (e.g., 'newRoundCompleted').
     * @param {Function} callback - The function to run when the event occurs.
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * Triggers all registered listeners for a specific event with optional data.
     * @param {string} eventName - The name of the event to trigger.
     * @param {*} data - The data payload to pass to the listeners.
     */
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            // Run all registered callbacks for this event
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ EventEmitter: Error executing callback for event "${eventName}"`, error);
                }
            });
        }
    }
}