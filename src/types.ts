// src/types.ts

/** Defines the valid evaluation strategies */
export type Strategy = 'first' | 'last' | 'random' | 'smart';

/** Defines the valid button style types */
export type ButtonType = 'filled' | 'outlined';

/**
 * Defines the "interface" for a selection strategy function.
 * It takes an array of options and returns the one to select.
 */
export type SelectionStrategy = (options: HTMLOptionElement[]) => HTMLOptionElement;
