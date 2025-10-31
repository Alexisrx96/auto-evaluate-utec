// src/content.ts
import { injectUI } from "./ui";

/**
 * Main function to run the auto-evaluator.
 */
function main(): void {
    console.log('Auto-Evaluator: Initializing...');
    injectUI();
}

// --- DOM Ready Execution ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

