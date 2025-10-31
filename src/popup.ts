import { Strategy } from "./types"; // <-- IMPORT the type

// --- Type Definitions ---

const form = document.getElementById('strategyForm') as HTMLFormElement;
const statusElement = document.getElementById('status') as HTMLDivElement;
const saveButton = document.getElementById('saveButton') as HTMLButtonElement;

/**
 * Saves the selected strategy to chrome.storage.sync.
 */
function saveOptions(e: Event): void {
    e.preventDefault();

    const formData = new FormData(form);
    const selectedStrategy = formData.get('strategy') as Strategy;

    if (!selectedStrategy) {
        statusElement.textContent = 'Por favor, selecciona una opción.';
        return;
    }

    chrome.storage.sync.set({
        preferredStrategy: selectedStrategy
    }, () => {
        // Update status to let user know options were saved.
        statusElement.textContent = '¡Preferencia guardada!';
        saveButton.textContent = 'Guardado';
        setTimeout(() => {
            statusElement.textContent = '';
            saveButton.textContent = 'Guardar';
        }, 1500);
    });
}

/**
 * Restores the saved strategy from chrome.storage.sync.
 */
function restoreOptions(): void {
    // Default to 'random' if no strategy is set
    chrome.storage.sync.get({
        preferredStrategy: 'random'
    }, (items) => {
        const preferredStrategy = items.preferredStrategy as Strategy;
        const radio = form.querySelector(`input[value="${preferredStrategy}"]`) as HTMLInputElement;
        if (radio) {
            radio.checked = true;
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
form.addEventListener('submit', saveOptions);
