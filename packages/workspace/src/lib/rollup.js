import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig, rollup, watch } from 'rollup';

/**
 * @param {string[]} entrypoints
 */
export async function rollupBuild(entrypoints) {
    const config = createRollupConfig(entrypoints);
    const build = await rollup(config);
    await build.write(config.output);
}

/**
 * @param {string[]} entrypoints
 */
export async function rollupWatch(entrypoints) {
    const config = createRollupConfig(entrypoints);
    watch(config);
}

/**
 * @param {string[]} entrypoints
 */
export function createRollupConfig(entrypoints) {
    return defineConfig({
        plugins: [
            typescript(),
            nodeResolve({
                extensions: ['.ts', '.mts', '.js', '.mjs', '.json', '.node'],
            }),
        ],
        input: entrypoints,
        treeshake: false,
        external: /(node_modules|^@citlali)/,
        output: {
            dir: 'dist',
            format: 'es',
            exports: 'named',
            preserveModules: true,
        },
        watch: {
            clearScreen: false,
        },
    });
}
