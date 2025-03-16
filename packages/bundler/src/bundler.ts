import { mergeAndConcat } from 'merge-anything';
import { defineConfig, InputPluginOption, OutputOptions, rollup, RollupWatcher, watch } from 'rollup';

import { Citlali } from './citlali';
import { UserscriptPlugin } from './rollup/userscript';

export class Bundler {
    protected watcher?: RollupWatcher;

    constructor(
        public readonly citlali: Citlali,
        public readonly entry: string,
    ) {}

    public async start() {
        if (this.citlali.args.watch) {
            await this.watch();
        } else {
            await this.build();
        }
    }

    public async stop() {
        await this.watcher?.close();
    }

    protected async build() {
        const options = await this.getRollupOptions();
        const build = await rollup(options);
        await build.write(options.output as OutputOptions);
    }

    protected async watch() {
        const options = await this.getRollupOptions();
        this.watcher = watch(options);
    }

    protected async getRollupOptions() {
        const custom = this.citlali.options.rollup;
        const plugins: InputPluginOption[] = [custom.plugins];

        if (/\.user\.tsx?$/.test(this.entry)) {
            const typescript = await import('@rollup/plugin-typescript');
            plugins.push(typescript.default());
        }

        if (/\.user\.[jt]sx?$/.test(this.entry)) {
            plugins.push(UserscriptPlugin(this));
        }

        delete custom.plugins;
        delete custom.input;
        delete custom.output;

        const base = defineConfig({
            plugins,
            input: 'citlali:userscript',
            output: {
                file: this.citlali.getOutputPath(this.entry),
                format: 'iife',
                inlineDynamicImports: true,
            },
        });

        return mergeAndConcat(base, custom);
    }
}
