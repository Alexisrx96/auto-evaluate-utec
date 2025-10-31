import { ButtonType, Strategy } from "./types";




// --- State for saved strategy ---
/**
 * Holds the user's preferred strategy, loaded from chrome.storage.sync.
 * Defaults to 'random'.
 */
let preferredStrategy: Strategy = 'random';


/**
 * Inserts buttons and logic to autocomplete the evaluation
 * with a Material-style UI and CSP-safe styling.
 */
function insertEvaluationTools(): void {

    // --- Array to manage button state (declarado aquí para ser accesible por setButtonsDisabled) ---
    const allButtons: HTMLButtonElement[] = [];
    /** Reference to the dropdown menu */
    let dropdownMenu: HTMLDivElement;

    // --- 1. Style Injector ---
    function injectStyles(): void {
        const styleId: string = 'auto-eval-styles';
        if (document.getElementById(styleId)) return;

        const cssRules: string = `
            .eval-btn {
                padding: 0.6rem 1.2rem;
                font-size: 0.875rem;
                font-weight: 500;
                border: 2px solid transparent;
                border-radius: 4px; /* Default radius */
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                /* Added 'filter' for tactile feedback */
                transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
                height: 40.8px; /* Consistent height */
                box-sizing: border-box; /* Include border/padding in height */
                vertical-align: top;
            }
            
            /* --- 'Filled' Style --- */
            .eval-btn--filled {
                background-color: var(--color-main);
                color: white;
                box-shadow: 0 2px 4px 0 rgba(0,0,0,0.1);
            }
            .eval-btn--filled:hover:not(:disabled) {
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.15);
                filter: brightness(0.95); /* Tactile feedback */
            }
            .eval-btn--filled:active:not(:disabled) {
                box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1);
                filter: brightness(0.90); /* Tactile feedback */
            }
            
            /* --- Disabled State --- */
            .eval-btn:disabled {
                opacity: 0.5;
                cursor: wait;
                box-shadow: none;
            }
            

            /* --- Button Group Styles --- */
            .eval-btn-group {
                position: relative; /* For dropdown positioning */
                display: inline-flex; /* To keep buttons together */
            }
            
            /* Main button */
            .eval-btn-group > .eval-btn:first-child {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }

            /* Dropdown button */
            .eval-btn-group > .eval-btn:last-child {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                border-left: 1px solid rgba(255, 255, 255, 0.35); /* Subtle divider */
                padding-left: 0.5rem;
                padding-right: 0.5rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            /* Toggle button */
            .eval-btn-group > #auto-eval-toggle-btn {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
            }

            /* --- Dropdown Menu Styles --- */
            .eval-dropdown-menu {
                display: none; /* Hidden by default */
                position: absolute;
                top: 100%; /* Position below the button group */
                right: 0;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 4px 12px 0 rgba(0,0,0,0.15);
                border: 1px solid #dadce0;
                z-index: 1000;
                margin-top: 4px;
                min-width: 160px;
                padding: 4px 0;
            }
            .eval-dropdown-menu.show {
                display: block;
            }

            .eval-dropdown-menu-item {
                display: block;
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                color: #3c4043;
                text-decoration: none;
                text-transform: none;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .eval-dropdown-menu-item:hover {
                background-color: #f1f3f4;
            }

            /* Active state for dropdown item */
            .eval-dropdown-menu-item--active {
                font-weight: 600; 
                color: #34A853; /* Use your primary color */
            }
            .eval-dropdown-menu-item--active::before {
                content: '\\2713\\00a0'; /* Checkmark + non-breaking space */
                font-family: sans-serif;
            }
        `;

        const styleSheet: HTMLStyleElement = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.textContent = cssRules;
        document.head.appendChild(styleSheet);
    }

    injectStyles();

    // --- 2. Find Target & Create UI Elements ---
    const header: HTMLElement | null = document.querySelector('#lbl_nombre_cuestionario');
    if (!header) {
        console.log('Auto-Evaluator: Target header not found.');
        return;
    }

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

    // --- Button Container ---
    const buttonContainer: HTMLDivElement = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: flex-start;';

    const logList: HTMLUListElement = document.createElement('ul');
    logList.style.cssText = `
        margin-top: 1.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        color: #3c4043;
        max-height: 200px;
        overflow-y: auto;
        background-color: #f8f9fa;
        border: 1px solid #dadce0;
        border-radius: 8px;
        list-style-type: none;
        font-family: "Roboto Mono", monospace;
        display: none; /* Hidden by default */
    `;
    logList.id = 'auto-eval-logs';


    // --- 3. Helper Functions ---

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
                setButtonsDisabled(true);
                onClick(e);
                setTimeout(() => setButtonsDisabled(false), 100);
            });
        }

        allButtons.push(button);
        return button;
    }

    /** Now disables all buttons */
    function setButtonsDisabled(disabled: boolean): void {
        allButtons.forEach(btn => {
            btn.disabled = disabled;
        });
    }

    function autoEvaluate(strategy: Strategy = 'first'): void {
        logList.innerHTML = '';
        logList.style.display = 'block';
        const selects: NodeListOf<HTMLSelectElement> = document.querySelectorAll('select.browser-default');
        let count: number = 0;

        if (selects.length === 0) {
            logList.innerHTML = '<li>No questions (selects) found.</li>';
            return;
        }

        selects.forEach((select: HTMLSelectElement) => {
            const options: HTMLOptionElement[] = Array.from(select.options)
                .filter((o: HTMLOptionElement) => !o.disabled && o.value !== '');

            if (!options.length) return;

            let optionToSelect: HTMLOptionElement;
            switch (strategy) {
                case 'first':
                    optionToSelect = options[0];
                    break;
                case 'last':
                    optionToSelect = options[options.length - 1];
                    break;
                case 'random':
                    optionToSelect = options[Math.floor(Math.random() * options.length)];
                    break;
                default:
                    optionToSelect = options[0];
            }

            select.value = optionToSelect.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));

            const li: HTMLLIElement = document.createElement('li');
            li.textContent = `Selected: "${optionToSelect.text}"`;
            li.style.padding = '0.25rem 0';
            logList.appendChild(li);
            count++;
        });

        const summary: HTMLLIElement = document.createElement('li');
        summary.style.fontWeight = 'bold';
        summary.style.marginTop = '0.5rem';
        summary.style.paddingTop = '0.5rem';
        summary.style.borderTop = `1px solid ${hexToRgba('#3c4043', 0.2)}`;
        summary.textContent = `Total: ${count} selections completed.`;
        logList.appendChild(summary);
    }

    // --- 4. Define Buttons & NEW Dropdown ---
    const G_GREEN: string = '#34A853';

    // Create the Button Group Wrapper
    const buttonGroup: HTMLDivElement = document.createElement('div');
    buttonGroup.className = 'eval-btn-group';

    // --- Button for preferred strategy ---
    const btnPreferred = createButton('Cargando...', 'filled', G_GREEN, () => {
        autoEvaluate(preferredStrategy);
    });
    btnPreferred.id = 'auto-eval-preferred-btn';

    // --- Toggle Button ---
    const btnToggle = createButton('\u25BC', 'filled', G_GREEN); // \u25BC is ▼
    btnToggle.id = 'auto-eval-toggle-btn';
    btnToggle.style.fontFamily = 'sans-serif'; // Ensure arrow renders well

    // --- Dropdown Menu ---
    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'eval-dropdown-menu';
    dropdownMenu.id = 'auto-eval-dropdown-menu';

    // Map strategies to user-friendly text (Cleaner text)
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
            setButtonsDisabled(true); // Disable all controls

            autoEvaluate(strat.value); // Run evaluation
            dropdownMenu.classList.remove('show'); // Hide menu

            setTimeout(() => {
                setButtonsDisabled(false);
            }, 200);
        });
        dropdownMenu.appendChild(item);
    });

    // --- Toggle Logic ---
    btnToggle.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop click from bubbling to document

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
    });

    // --- Global click listener to close menu ---
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
    container.appendChild(logList);

    header.insertAdjacentElement('afterend', container);
}

// --- Helper function to update the preferred button text ---
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

// --- Function to load saved strategy from storage ---
function loadStrategy(): void {
    chrome.storage.sync.get({
        preferredStrategy: 'random'
    }, (items) => {
        preferredStrategy = items.preferredStrategy as Strategy;
        console.log('Auto-Evaluator: Preferred strategy loaded:', preferredStrategy);
        updatePreferredButtonText(preferredStrategy);
    });
}

// --- Listen for changes in storage ---
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.preferredStrategy) {
        preferredStrategy = changes.preferredStrategy.newValue as Strategy;
        console.log('Auto-Evaluator: Preferred strategy updated:', preferredStrategy);
        updatePreferredButtonText(preferredStrategy);
    }
});


// --- 6. DOM Ready Execution ---
function main(): void {
    insertEvaluationTools();
    loadStrategy();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
