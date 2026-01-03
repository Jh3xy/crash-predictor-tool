/*
    info.js
    Console warning to inform and protect users from "Self-XSS" attacks and console info for debugging and dev related inspections
*/ 
const warningTitle = " STOP! ";
const warningTitleStyle = "color: red; font-size: 32px; font-weight: bold; -webkit-text-stroke: 1px black;";

const warningMessage = `
This is a browser feature intended for developers. 

If someone told you to copy and paste something here to "rig" the Oracle tool or "guarantee" crash results, they are lying to you. 

Pasting code here can give attackers access to your data or manipulate your app session. Oracle developers will NEVER ask you to paste code into this console.
`;

const messageStyle = "font-size: 14px; font-weight: bold; color: #e7e6e69f;";

// Execute the styled logs
console.log(`%c${warningTitle}`, warningTitleStyle);
console.log(`%c${warningMessage}`, messageStyle);

// Current App Version
const APP_VERSION = "2.4.0";

// 1. Version Log (Simple and clean)
console.log(`%cOracle %cv${APP_VERSION}`, 
    "color: #888; font-weight: bold;", 
    "color: #00ff00; font-weight: bold; background: #222; padding: 2px 5px; border-radius: 3px;"
);

// 2. System Ready Log (Functional)
// You could call this from your main script.js after everything loads
window.logSystemReady = function() {
    console.log("%c[SYSTEM]: %cAll modules initialized. Predictive engine standby.", 
        "color: #3498db; font-weight: bold;", 
        "color: #888;"
    );
};