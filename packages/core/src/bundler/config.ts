import multi from '@rollup/plugin-multi-entry';
import { RollupOptions } from "rollup";
import { ResolvedCitlaliOptions, RollupOptionsOverride } from "../config";

export function resolveRollupConfig(options: ResolvedCitlaliOptions): RollupOptions {
    const override: RollupOptionsOverride = {
        external: options.rollup.external,
        jsx: options.rollup.jsx,
        treeshake: options.rollup.treeshake,
    };

    let plugins = options.rollup?.plugins;
    if (!plugins) plugins = [];
    if (!Array.isArray(plugins)) plugins = [plugins];

    return {
        input: options.input,
        output: {
            dir: options.output,
            format: 'iife',
            banner: undefined,
        },
        plugins: [multi(), ...plugins],
        ...override,
    };
}
