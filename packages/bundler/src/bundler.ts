import typescript from '@rollup/plugin-typescript';
import chalk from 'chalk';
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
        let start: DOMHighResTimeStamp;

        const options = await this.getRollupOptions();
        this.watcher = watch(options);
        this.watcher.on('event', (event) => {
            switch (event.code) {
                case 'START': {
                    start = performance.now();
                    break;
                }

                case 'BUNDLE_START': {
                    const input = chalk.bold(this.entry);
                    const output = chalk.bold(this.citlali.options.dist);
                    console.log(chalk.cyan(`bundles ${input} → ${output}...`));
                    break;
                }

                case 'BUNDLE_END': {
                    const output = chalk.bold(this.citlali.getOutputPath(this.entry));
                    const elapsed = chalk.bold(Math.round(performance.now() - start) + 'ms');
                    console.log(chalk.green(`created ${output} in ${elapsed}`));
                    break;
                }

                case 'END': {
                    console.log('waiting for changes...');
                    break;
                }
            }
        });
    }

    protected async getRollupOptions() {
        const plugins: InputPluginOption[] = [];

        if (/\.user\.tsx?$/.test(this.entry)) {
            plugins.push(typescript());
        }

        if (/\.user\.[jt]sx?$/.test(this.entry)) {
            plugins.push(UserscriptPlugin(this));
        }

        const base = defineConfig({
            plugins,
            input: 'citlali:userscript',
            output: {
                file: this.citlali.getOutputPath(this.entry),
                format: 'iife',
                inlineDynamicImports: true,
            },
        });

        const custom = this.citlali.options.rollup;
        delete custom.input;
        delete custom.output;

        return mergeAndConcat(base, custom);
    }
}
