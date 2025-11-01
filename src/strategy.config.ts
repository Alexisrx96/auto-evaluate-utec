// src/strategy.config.ts

/**
 * Defines the selection logic for each strategy.
 * These functions take an array of valid options and return the one to select.
 */

function getFirstChoice(options: HTMLOptionElement[]): HTMLOptionElement {
    return options[0];
}

function getLastChoice(options: HTMLOptionElement[]): HTMLOptionElement {
    return options[options.length - 1];
}

function getRandomChoice(options: HTMLOptionElement[]): HTMLOptionElement {
    return options[Math.floor(Math.random() * options.length)];
}

// -----------------------------------------------------------------
// ✨ NEW STRATEGY FUNCTION ✨
// We can define the "smart" logic here.
// For now, let's make it just pick the first option (like 'Excelente').
// We can change this logic later without touching any other file.
// -----------------------------------------------------------------
function getSmartChoice(options: HTMLOptionElement[]): HTMLOptionElement {
    // For now, "smart" is the same as "first"
    // We can add more complex logic here later.
    return options[0];
}


/**
 * The single source of truth for all evaluation strategies.
 */
export const STRATEGY_DEFINITIONS = [
    // ✨ NEW STRATEGY ADDED HERE ✨
    {
        id: 'smart',
        name: 'Inteligente', // For UI dropdowns and button text
        description: 'Inteligente (Sugerido)', // For popup radio description
        fn: getSmartChoice
    },
    {
        id: 'random',
        name: 'Aleatorio',
        description: 'Aleatorio',
        fn: getRandomChoice
    },
    {
        id: 'first',
        name: 'Primero',
        description: 'Primero (Excelente)',
        fn: getFirstChoice
    },
    {
        id: 'last',
        name: 'Último',
        description: 'Último (Malo)',
        fn: getLastChoice
    }
];

/**
 * A map of strategy IDs to their corresponding selection functions.
 * e.g., 'first' -> getFirstChoice(options)
 */
export const strategyMap = Object.fromEntries(
    STRATEGY_DEFINITIONS.map(s => [s.id, s.fn])
);

/**
 * A helper to get the full strategy definition object by its ID.
 */
export function findStrategyById(id: string) {
    return STRATEGY_DEFINITIONS.find(s => s.id === id);
}

/**
 * Helper to find the default strategy.
 * We'll use this to update the storage logic.
 */
export function getDefaultStrategyId(): string {
    // Let's make 'smart' the new default
    return 'smart';
}
