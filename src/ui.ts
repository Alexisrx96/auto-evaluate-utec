// src/ui.ts
import { ButtonType, Strategy } from "./types";
import { loadStrategy, listenForStrategyChanges } from "./storage";
import { autoEvaluate } from "./evaluator";
// 👈 IMPORT OUR NEW CONFIG
import { STRATEGY_DEFINITIONS, findStrategyById } from "./strategy.config";

// --- Module State ---
let preferredStrategy: Strategy = 'random';
// ... (rest of module state remains the same) ...
const allButtons: HTMLButtonElement[] = [];
let dropdownMenu: HTMLDivElement;
let scorePanel: HTMLUListElement;

/**
 * Inserts buttons and logic to autocomplete the evaluation.
 */
export async function injectUI(): Promise<void> {

    // ... (1. Find Target remains the same) ...
    const header: HTMLElement | null = document.querySelector('#lbl_nombre_cuestionario');
    if (!header) {
        console.log('Auto-Evaluator: Target header not found.');
        return;
    }

    // ... (2. Create UI Elements remains the same) ...
    const container: HTMLDivElement = document.createElement('div');
    container.className = 'eval-panel-container'; // 👈 CHANGED

    const title: HTMLHeadingElement = document.createElement('h3');
    title.textContent = 'Panel de Auto-Evaluación';
    title.className = 'eval-panel-title'; // 👈 CHANGED

    const buttonContainer: HTMLDivElement = document.createElement('div');
    buttonContainer.className = 'eval-button-container'; // 👈 CHANGED

    // --- Score Panel (assign to module state) ---
    scorePanel = document.createElement('ul');
    scorePanel.id = 'auto-eval-logs';


    // ... (3. Define Buttons & Dropdown) ...
    const G_GREEN_CLASS: string = 'eval-btn--filled-green';

    const buttonGroup: HTMLDivElement = document.createElement('div');
    buttonGroup.className = 'eval-btn-group';

    const btnPreferred = createButton('Cargando...', 'filled', G_GREEN_CLASS, () => {
        runEvaluation(preferredStrategy);
    });
    btnPreferred.id = 'auto-eval-preferred-btn';

    const btnToggle = createButton('\u25BC', 'filled', G_GREEN_CLASS);
    btnToggle.id = 'auto-eval-toggle-btn';
    btnToggle.style.fontFamily = 'sans-serif';

    // --- Dropdown Menu (assign to module state) ---
    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'eval-dropdown-menu';
    dropdownMenu.id = 'auto-eval-dropdown-menu';

    // --- (REFACTORED) ---
    // Dynamically build dropdown from our config
    STRATEGY_DEFINITIONS.forEach(strat => {
        const item = document.createElement('a');
        item.href = '#';
        // Use the short 'name' from our config
        item.textContent = strat.name;
        item.className = 'eval-dropdown-menu-item';
        item.dataset.strategy = strat.id; // Store strategy in data attribute

        item.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            runEvaluation(strat.id as Strategy); // Run evaluation
            dropdownMenu.classList.remove('show'); // Hide menu
        });
        dropdownMenu.appendChild(item);
    });
    // --- (END REFACTOR) ---


    // ... (4. Add Event Listeners remains the same) ...
    btnToggle.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop click from bubbling to document
        toggleDropdown();
    });

    // Global click listener to close menu
    document.addEventListener('click', (e: MouseEvent) => {
        if (dropdownMenu.classList.contains('show') && !buttonGroup.contains(e.target as Node)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // ... (5. Assemble and Inject UI remains the same) ...
    container.appendChild(title);
    buttonGroup.appendChild(btnPreferred);
    buttonGroup.appendChild(btnToggle);
    buttonGroup.appendChild(dropdownMenu);
    buttonContainer.appendChild(buttonGroup);
    container.appendChild(buttonContainer);
    container.appendChild(scorePanel);

    header.insertAdjacentElement('afterend', container);

    // ... (6. Load Initial State & Listen for Changes remains the same) ...
    preferredStrategy = await loadStrategy();
    console.log('Auto-Evaluator: Preferred strategy loaded:', preferredStrategy);
    updatePreferredButtonText(preferredStrategy);

    listenForStrategyChanges((newStrategy) => {
        console.log('Auto-Evaluator: Preferred strategy updated:', newStrategy);
        preferredStrategy = newStrategy;
        updatePreferredButtonText(newStrategy);
    });
}


// --- Helper Functions ---

// ... (runEvaluation and setButtonsDisabled remain the same) ...
function runEvaluation(strategy: Strategy): void {
    setButtonsDisabled(true);
    // Call the evaluator
    autoEvaluate(strategy, scorePanel);
    // Re-enable buttons after a short delay
    setTimeout(() => setButtonsDisabled(false), 100);
}

function setButtonsDisabled(disabled: boolean): void {
    allButtons.forEach(btn => {
        btn.disabled = disabled;
    });
}

function updatePreferredButtonText(strategyId: Strategy): void {
    const btn = document.getElementById('auto-eval-preferred-btn') as HTMLButtonElement;
    if (btn) {
        // --- (REFACTORED) ---
        // Get the definition from our config
        const strategyDef = findStrategyById(strategyId) || findStrategyById('random');
        const strategyText = strategyDef ? strategyDef.name : 'Aleatorio';
        // --- (END REFACTOR) ---

        btn.textContent = `Evaluar (${strategyText})`;
    }
}

// ... (toggleDropdown remains the same) ...
function toggleDropdown(): void {
    // Update active state before showing the menu
    if (!dropdownMenu.classList.contains('show')) {
        const items = dropdownMenu.querySelectorAll('.eval-dropdown-menu-item');
        items.forEach(item => {
            const itemEl = item as HTMLElement;
            if (itemEl.dataset.strategy === preferredStrategy) {
                itemEl.classList.add('eval-dropdown-menu-item--active');
            } else {
                itemEl.classList.remove('eval-dropdown-menu-item--active');
            }
        });
    }
    dropdownMenu.classList.toggle('show');
}


// ... (createButton remains the same) ...
function createButton(text: string, type: ButtonType, colorClass: string = '', onClick?: (e: MouseEvent) => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.textContent = text;
    button.type = 'button';

    button.classList.add('eval-btn');

    // Add color class if provided
    if (colorClass) {
        button.classList.add(colorClass);
    }

    if (type === 'filled') {
        button.classList.add('eval-btn--filled');
    } else { // 'outlined'
        button.classList.add('eval-btn--outlined');
        // Note: The 'outlined' style in your CSS doesn't use --color-main,
        // but if it did, the 'eval-btn--filled-green' class would set it.
    }

    if (onClick) {
        button.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            onClick(e);
        });
    }

    allButtons.push(button);
    return button;
}
