// src/content.ts
import { injectUI } from "./ui";

/**
 * Main function to run the auto-evaluator.
 */
function main(): void {
    try {
        console.log('Auto-Evaluator: Initializing...');
        injectUI();
    } catch (error) {
        console.error('Auto-Evaluator: Failed to initialize UI.', error);
    }
}

// --- DOM Ready Execution ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
