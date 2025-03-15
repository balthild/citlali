import { rollupBuild } from '../lib/rollup.js';

/**
 * @param  {...string} entrypoints
 */
export default async function main(...entrypoints) {
    // await tscTypecheck();
    await rollupBuild(entrypoints);
}
