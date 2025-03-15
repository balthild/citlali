import { rollupWatch } from '../lib/rollup.js';

/**
 * @param  {...string} entrypoints
 */
export default async function main(...entrypoints) {
    // await tscWatch();
    await rollupWatch(entrypoints);
}
