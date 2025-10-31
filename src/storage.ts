// src/storage.ts
import { Strategy } from "./types";

/**
 * Loads the preferred strategy from storage, defaulting to 'random'.
 */
export async function loadStrategy(): Promise<Strategy> {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            preferredStrategy: 'random'
        }, (items) => {
            resolve(items.preferredStrategy as Strategy);
        });
    });
}

/**
 * Listens for changes to the preferred strategy and calls a callback function.
 * @param callback Function to call with the new strategy
 */
export function listenForStrategyChanges(callback: (newStrategy: Strategy) => void): void {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && changes.preferredStrategy) {
            callback(changes.preferredStrategy.newValue as Strategy);
        }
    });
}
