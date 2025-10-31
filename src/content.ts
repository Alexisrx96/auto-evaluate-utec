// src/content.ts
import { UI, UIControls } from "./ui";
import { Strategy, SelectionStrategy } from "./types";
import * as storage from "./storage";
import * as page from "./page.service";
import * as evaluator from "./evaluator";

// --- Strategy Definitions ---


const getSmartChoice: SelectionStrategy = (options) => {
    const rand = Math.random();
    if (rand < 0.70) return options[0]; // 70%
    if (rand < 0.90) return options[1] || options[0]; // 20%
    return options[2] || options[0]; // 10%
};

const getFirstChoice: SelectionStrategy = (options) => options[0];

const getLastChoice: SelectionStrategy = (options) => options[options.length - 1];

const getRandomChoice: SelectionStrategy = (options) => {
    return options[Math.floor(Math.random() * options.length)];
};

// --- Strategy Map ---
const strategyMap: Record<Strategy, SelectionStrategy> = {
    'smart': getSmartChoice,
    'first': getFirstChoice,
    'last': getLastChoice,
    'random': getRandomChoice
};

// --- Main Application Controller ---

/**
 * Main function to run the auto-evaluator.
 * This acts as the "Controller" or "Orchestrator".
 */
async function main(): Promise<void> {
    try {
        console.log('Auto-Evaluator: Initializing...');

        // 1. Find DOM anchor
        const header = page.getEvaluationHeader();
        if (!header) {
            console.log('Auto-Evaluator: Target header not found.');
            return;
        }

        let uiControls: UIControls;

        // 2. Define application logic
        const handleEvaluation = async (strategyName: Strategy) => {
            if (!uiControls) return;

            uiControls.setLoading(true);
            uiControls.clearLogs();

            try {
                // 3. Get data from DOM
                const selects = page.getSelectableQuestions();
                const sections = page.getScoreSections();

                if (selects.length === 0) {
                    uiControls.showError('No se encontraron preguntas (selects).');
                    uiControls.setLoading(false);
                    return;
                }

                // 4. Find the correct strategy function from the map
                const strategyFunction = strategyMap[strategyName] || getRandomChoice;

                // 5. Call Core Logic (Step 1: Selection)
                const count = evaluator.selectAnswers(selects, strategyFunction);

                // 6. Trigger DOM updates
                selects.forEach(page.dispatchChangeEvent);

                // 7. Call Core Logic (Step 2: Scoring)
                setTimeout(() => {
                    // This now calls the correct, reverted calculateScores function
                    const scores = evaluator.calculateScores(sections);
                    const summary = `Total: ${count} preguntas completadas.`;

                    // 8. Update UI
                    uiControls.showScores(scores.join('\n'), summary);
                    uiControls.setLoading(false);
                }, 100); // 100ms delay to allow DOM to react

            } catch (err: any) {
                console.error('Auto-Evaluator: Failed during evaluation', err);
                uiControls.showError(`Error: ${err.message}`);
                uiControls.setLoading(false);
            }
        };

        // 9. Inject UI (View)
        uiControls = new UI(header, { onEvaluate: handleEvaluation });

        // 10. Load initial strategy (Storage) and update UI
        const initialStrategy = await storage.loadStrategy();
        uiControls.updatePreferredStrategy(initialStrategy);

        // 11. Listen for storage changes and update UI
        storage.listenForStrategyChanges((newStrategy) => {
            uiControls.updatePreferredStrategy(newStrategy);
        });

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
