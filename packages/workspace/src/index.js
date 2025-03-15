import { createRollupConfig } from './lib/rollup.js';

/**
 * @typedef {object} WorkspaceRollupOptions
 * @property {string[]} entrypoints
 */

/**
 * @param {WorkspaceRollupOptions} options
 * @returns {import('rollup').RollupOptions}
 */
export function defineRollupConfig(options) {
    return createRollupConfig(options.entrypoints);
}
