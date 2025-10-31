// src/ui.ts
import { ButtonType, Strategy } from "./types";
import { loadStrategy, listenForStrategyChanges } from "./storage";
import { autoEvaluate } from "./evaluator";

// --- Module State ---
let preferredStrategy: Strategy = 'random';
const allButtons: HTMLButtonElement[] = [];
let dropdownMenu: HTMLDivElement;
let scorePanel: HTMLUListElement;

/**
 * Inserts buttons and logic to autocomplete the evaluation.
 */
export async function injectUI(): Promise<void> {

    // --- 1. Find Target ---
    const header: HTMLElement | null = document.querySelector('#lbl_nombre_cuestionario');
    if (!header) {
        console.log('Auto-Evaluator: Target header not found.');
        return;
    }

    // --- 2. Create UI Elements ---
    const container: HTMLDivElement = document.createElement('div');
    container.style.cssText = `
        margin-top: 1.5rem;
        padding: 1.5rem;
        border: none;
        border-radius: 12px;
        background-color: #fff;
        box-shadow: 0 2px 8px 0 rgba(0,0,0,0.12);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    const title: HTMLHeadingElement = document.createElement('h3');
    title.textContent = 'Panel de Auto-Evaluación';
    title.style.cssText = `
        margin-top: 0; 
        margin-bottom: 1.5rem; 
        font-size: 1.25rem; 
        font-weight: 500;
        color: #202124;
    `;

    const buttonContainer: HTMLDivElement = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: flex-start;';

    // --- Score Panel (assign to module state) ---
    scorePanel = document.createElement('ul');
    scorePanel.id = 'auto-eval-logs';


    // --- 3. Define Buttons & Dropdown ---
    const G_GREEN: string = '#34A853';

    // Create the Button Group Wrapper
    const buttonGroup: HTMLDivElement = document.createElement('div');
    buttonGroup.className = 'eval-btn-group';

    // --- Button for preferred strategy ---
    const btnPreferred = createButton('Cargando...', 'filled', G_GREEN, () => {
        runEvaluation(preferredStrategy);
    });
    btnPreferred.id = 'auto-eval-preferred-btn';

    // --- Toggle Button ---
    const btnToggle = createButton('\u25BC', 'filled', G_GREEN); // \u25BC is ▼
    btnToggle.id = 'auto-eval-toggle-btn';
    btnToggle.style.fontFamily = 'sans-serif'; // Ensure arrow renders well

    // --- Dropdown Menu (assign to module state) ---
    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'eval-dropdown-menu';
    dropdownMenu.id = 'auto-eval-dropdown-menu';

    // Map strategies to user-friendly text
    const otherStrategies: { value: Strategy, text: string }[] = [
        { value: 'random', text: 'Aleatorio' },
        { value: 'first', text: 'Primero' },
        { value: 'last', text: 'Último' },
    ];

    otherStrategies.forEach(strat => {
        const item = document.createElement('a');
        item.href = '#';
        item.textContent = strat.text;
        item.className = 'eval-dropdown-menu-item';
        item.dataset.strategy = strat.value; // Store strategy in data attribute

        item.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            runEvaluation(strat.value); // Run evaluation
            dropdownMenu.classList.remove('show'); // Hide menu
        });
        dropdownMenu.appendChild(item);
    });

    // --- 4. Add Event Listeners ---
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

    // --- 5. Assemble and Inject UI ---
    container.appendChild(title);
    buttonGroup.appendChild(btnPreferred);
    buttonGroup.appendChild(btnToggle);
    buttonGroup.appendChild(dropdownMenu);
    buttonContainer.appendChild(buttonGroup);
    container.appendChild(buttonContainer);
    container.appendChild(scorePanel);

    header.insertAdjacentElement('afterend', container);

    // --- 6. Load Initial State & Listen for Changes ---
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

function updatePreferredButtonText(strategy: Strategy): void {
    const btn = document.getElementById('auto-eval-preferred-btn') as HTMLButtonElement;
    if (btn) {
        let strategyText: string = strategy;
        switch (strategy) {
            case 'first': strategyText = 'Primero'; break;
            case 'last': strategyText = 'Último'; break;
            case 'random': strategyText = 'Aleatorio'; break;
        }
        btn.textContent = `Evaluar (${strategyText})`;
    }
}

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

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createButton(text: string, type: ButtonType, color: string, onClick?: (e: MouseEvent) => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.textContent = text;
    button.type = 'button';

    button.classList.add('eval-btn');

    if (type === 'filled') {
        button.classList.add('eval-btn--filled');
        button.style.setProperty('--color-main', color);

    } else { // 'outlined'
        button.classList.add('eval-btn--outlined');
        button.style.setProperty('--color-main', color);
        button.style.setProperty('--color-hover', hexToRgba(color, 0.08));
        button.style.setProperty('--color-active', hexToRgba(color, 0.15));
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
