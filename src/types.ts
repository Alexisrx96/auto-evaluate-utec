// src/types.ts
import { STRATEGY_DEFINITIONS } from "./strategy.config";

/** * Defines the valid evaluation strategies.
 * This type is dynamically generated from strategy.config.ts.
 */
export type Strategy = typeof STRATEGY_DEFINITIONS[number]['id'];

/** Defines the valid button style types */
export type ButtonType = 'filled' | 'outlined';
