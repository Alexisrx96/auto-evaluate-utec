// src/ui.ts
import { ButtonType, Strategy } from "./types";

/**
 * Callbacks for UI-driven events.
 * The View tells the Controller "this happened".
 */
export interface UIActions {
    onEvaluate: (strategy: Strategy) => void;
}

/**
 * Methods to update the UI state.
 * The Controller tells the View "update like this".
 */
export interface UIControls {
    setLoading: (loading: boolean) => void;
    updatePreferredStrategy: (strategy: Strategy) => void;
    showScores: (scoreLines: string, summary: string) => void;
    showError: (message: string) => void;
    clearLogs: () => void;
}

/**
 * UI Class
 * Encapsulates all logic for creating, controlling,
 * and updating the auto-evaluation UI panel.
 */
export class UI implements UIControls {
    // --- Private Instance Properties ---
    private allButtons: HTMLButtonElement[] = [];
    private dropdownMenu: HTMLDivElement;
    private scorePanel: HTMLUListElement;
    private preferredStrategy: Strategy = 'random';
    private actions: UIActions; // Callbacks to the controller

    /**
     * Creates and injects the UI onto the page.
     * @param anchor The DOM element to inject the UI after.
     * @param actions Callbacks for UI events.
     */
    constructor(anchor: HTMLElement, actions: UIActions) {
        this.actions = actions;

        // --- Create UI Elements ---
        const container: HTMLDivElement = document.createElement('div');
        container.className = 'eval-panel-container';

        const title: HTMLHeadingElement = document.createElement('h3');
        title.textContent = 'Panel de Auto-Evaluación';
        title.className = 'eval-panel-title';

        const buttonContainer: HTMLDivElement = document.createElement('div');
        buttonContainer.className = 'eval-button-container';

        // Assign to instance property
        this.scorePanel = document.createElement('ul');
        this.scorePanel.id = 'auto-eval-logs';

        const G_GREEN_CLASS: string = 'eval-btn--filled-green';
        const buttonGroup: HTMLDivElement = document.createElement('div');
        buttonGroup.className = 'eval-btn-group';

        // --- Button for preferred strategy ---
        const btnPreferred = this.createButton('Cargando...', 'filled', G_GREEN_CLASS, () => {
            // Use instance properties and methods
            this.actions.onEvaluate(this.preferredStrategy);
        });
        btnPreferred.id = 'auto-eval-preferred-btn';

        // --- Toggle Button ---
        const btnToggle = this.createButton('\u25BC', 'filled', G_GREEN_CLASS);
        btnToggle.id = 'auto-eval-toggle-btn';
        btnToggle.style.fontFamily = 'sans-serif';

        // --- Dropdown Menu (assign to instance property) ---
        this.dropdownMenu = document.createElement('div');
        this.dropdownMenu.className = 'eval-dropdown-menu';
        this.dropdownMenu.id = 'auto-eval-dropdown-menu';

        // --- IMPROVEMENT 1: 'smart' strategy added ---
        const allStrategies: { value: Strategy, text: string }[] = [
            { value: 'smart', text: 'Inteligente' },
            { value: 'random', text: 'Aleatorio' },
            { value: 'first', text: 'Primero' },
            { value: 'last', text: 'Último' },
        ];

        allStrategies.forEach(strat => {
            const item = document.createElement('a');
            item.href = '#';
            item.textContent = strat.text;
            item.className = 'eval-dropdown-menu-item';
            item.dataset.strategy = strat.value;

            item.addEventListener('click', (e: MouseEvent) => {
                e.preventDefault();
                this.actions.onEvaluate(strat.value); // Use callback
                this.dropdownMenu.classList.remove('show'); // Hide menu
            });
            this.dropdownMenu.appendChild(item);
        });

        // --- Add Event Listeners ---
        btnToggle.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation(); // Stop click from bubbling to document
            this.toggleDropdown(); // Use class method
        });

        // Global click listener to close menu
        document.addEventListener('click', (e: MouseEvent) => {
            if (this.dropdownMenu.classList.contains('show') && !buttonGroup.contains(e.target as Node)) {
                this.dropdownMenu.classList.remove('show');
            }
        });

        // --- Assemble and Inject UI ---
        container.appendChild(title);
        buttonGroup.appendChild(btnPreferred);
        buttonGroup.appendChild(btnToggle);
        buttonGroup.appendChild(this.dropdownMenu); // Use instance property
        buttonContainer.appendChild(buttonGroup);
        container.appendChild(buttonContainer);
        container.appendChild(this.scorePanel); // Use instance property

        anchor.insertAdjacentElement('afterend', container);

        // Note: The constructor doesn't need to return anything.
        // The 'uiControls' will be the class instance itself.
    }

    // --- Public Control Methods (from UIControls) ---

    public setLoading(loading: boolean): void {
        this.setButtonsDisabled(loading);
    }

    public updatePreferredStrategy(strategy: Strategy): void {
        this.preferredStrategy = strategy;
        console.log('Auto-Evaluator: UI strategy updated:', strategy);
        this.updatePreferredButtonText(strategy);
    }

    public showScores(scoreLines: string, summary: string): void {
        this.scorePanel.style.display = 'block';

        const logPreElement = document.createElement('pre');
        if (scoreLines.length > 0) {
            logPreElement.innerHTML = `<strong>Puntajes por Sección (basado en la evaluación aplicada):</strong>\n\n${scoreLines}`;
        } else {
            logPreElement.innerHTML = '<pre>No se pudieron calcular los puntajes.</pre>';
        }

        this.scorePanel.innerHTML = ''; // Clear previous
        this.scorePanel.appendChild(logPreElement);

        const summaryEl = document.createElement('li');
        summaryEl.style.cssText = `font-weight: bold; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(60, 64, 67, 0.2); list-style: none;`;
        summaryEl.textContent = summary;
        this.scorePanel.appendChild(summaryEl);
    }

    public showError(message: string): void {
        this.scorePanel.innerHTML = `<pre>${message}</pre>`;
        this.scorePanel.style.display = 'block';
    }

    public clearLogs(): void {
        this.scorePanel.innerHTML = '<pre>Empezando evaluación...</pre>';
        this.scorePanel.style.display = 'block';
    }

    // --- Private Helper Methods ---

    /** Disables or enables all buttons managed by this UI instance. */
    private setButtonsDisabled(disabled: boolean): void {
        this.allButtons.forEach(btn => {
            btn.disabled = disabled;
        });
        if (!disabled) {
            // Restore text when un-setting loading
            this.updatePreferredButtonText(this.preferredStrategy);
        }
    }

    /** Updates the main button text to reflect the current strategy. */
    private updatePreferredButtonText(strategy: Strategy): void {
        const btn = document.getElementById('auto-eval-preferred-btn') as HTMLButtonElement;
        if (btn) {
            let strategyText: string;
            switch (strategy) {
                case 'first': strategyText = 'Primero'; break;
                case 'last': strategyText = 'Último'; break;
                case 'random': strategyText = 'Aleatorio'; break;
                case 'smart': strategyText = 'Inteligente'; break;
                default: strategyText = 'Aleatorio';
            }
            btn.textContent = `Evaluar (${strategyText})`;
        }
    }

    /** Toggles the visibility of the dropdown menu. */
    private toggleDropdown(): void {
        // Update active state before showing the menu
        if (!this.dropdownMenu.classList.contains('show')) {
            const items = this.dropdownMenu.querySelectorAll('.eval-dropdown-menu-item');
            items.forEach(item => {
                const itemEl = item as HTMLElement;
                if (itemEl.dataset.strategy === this.preferredStrategy) {
                    itemEl.classList.add('eval-dropdown-menu-item--active');
                } else {
                    itemEl.classList.remove('eval-dropdown-menu-item--active');
                }
            });
        }
        this.dropdownMenu.classList.toggle('show');
    }

    /**
     * Factory function to create a new button.
     */
    private createButton(text: string, type: ButtonType, colorClass: string = '', onClick?: (e: MouseEvent) => void): HTMLButtonElement {
        const button: HTMLButtonElement = document.createElement('button');
        button.textContent = text;
        button.type = 'button';

        button.classList.add('eval-btn');
        if (colorClass) button.classList.add(colorClass);

        if (type === 'filled') {
            button.classList.add('eval-btn--filled');
        } else { // 'outlined'
            button.classList.add('eval-btn--outlined');
        }

        if (onClick) {
            button.addEventListener('click', (e: MouseEvent) => {
                e.preventDefault();
                onClick(e);
            });
        }

        this.allButtons.push(button); // Add to instance list
        return button;
    }
}
