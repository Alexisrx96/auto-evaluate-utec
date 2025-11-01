// src/popup.ts
import { Strategy } from "./types";
import { getDefaultStrategyId, STRATEGY_DEFINITIONS } from "./strategy.config"; // 👈 IMPORT

// --- Type Definitions ---
const form = document.getElementById('strategyForm') as HTMLFormElement;
const statusElement = document.getElementById('status') as HTMLDivElement;
const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
const strategyContainer = document.getElementById('strategy-container') as HTMLDivElement;

/**
 * Saves the selected strategy to chrome.storage.sync.
 */
function saveOptions(e: Event): void {
    e.preventDefault();

    const formData = new FormData(form);
    const selectedStrategy = formData.get('strategy') as Strategy;

    if (!selectedStrategy) {
        if (statusElement) {
            statusElement.textContent = 'Por favor, selecciona una opción.';
        }
        return;
    }

    chrome.storage.sync.set({
        preferredStrategy: selectedStrategy
    }, () => {
        // ... (status update logic remains the same) ...
        if (statusElement) statusElement.textContent = '¡Preferencia guardada!';
        if (saveButton) saveButton.textContent = 'Guardado';

        setTimeout(() => {
            if (statusElement) statusElement.textContent = '';
            if (saveButton) saveButton.textContent = 'Guardar';
        }, 1500);
    });
}

/**
 * Builds the radio buttons dynamically from the config.
 */
function buildStrategyOptions(currentStrategy: Strategy): void {
    if (!strategyContainer) return;

    strategyContainer.innerHTML = ''; // Clear container

    STRATEGY_DEFINITIONS.forEach(strategy => {
        const div = document.createElement('div');
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'strategy';
        radio.value = strategy.id;

        // Check this radio if it's the currently saved strategy
        if (strategy.id === currentStrategy) {
            radio.checked = true;
        }

        label.appendChild(radio);
        // Use the descriptive name from our config
        label.appendChild(document.createTextNode(` ${strategy.description}`));

        div.appendChild(label);
        strategyContainer.appendChild(div);
    });
}

/**
 * Restores the saved strategy from chrome.storage.sync.
 */
function restoreOptions(): void {
    const defaultStrategy = getDefaultStrategyId();
    // Default to 'smart' if no strategy is set
    chrome.storage.sync.get({
        preferredStrategy: defaultStrategy
    }, (items) => {
        const preferredStrategy = items.preferredStrategy as Strategy;
        // Build the form UI with the loaded strategy
        buildStrategyOptions(preferredStrategy);
    });
}

// Add null checks before adding listeners
if (form && strategyContainer) {
    document.addEventListener('DOMContentLoaded', restoreOptions);
    form.addEventListener('submit', saveOptions);
} else {
    console.error('Auto-Evaluator Popup: Could not find key elements.');
}
