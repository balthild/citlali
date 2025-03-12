import { Citlali } from './citlali';
import { StylesEmitter } from './userscript/emitter';
import { EntryPointPlugin } from './userscript/entry';
import { InlineStylePlugin } from './userscript/style';

export class Bundler {
    public readonly citlali: Citlali;
    public readonly entry: string;
    public readonly sources: Set<string>;

    constructor(citlali: Citlali, entry: string) {
        this.citlali = citlali;
        this.entry = entry;
        this.sources = new Set([entry]);
    }

    public async trigger(path: string) {
        if (this.sources.has(path)) {
            await this.build();
        }
    }

    public async build() {
        const styles = new StylesEmitter();

        const out = await Bun.build({
            entrypoints: [this.entry],
            target: 'browser',
            format: 'esm',
            packages: 'external',
            splitting: false,
            plugins: [InlineStylePlugin(styles)],
        });

        await Bun.build({
            entrypoints: [this.entry],
            outdir: this.citlali.options.dist,
            minify: this.citlali.options.minify,
            target: 'browser',
            format: 'iife',
            splitting: false,
            naming: this.citlali.getOutputName(this.entry),
            plugins: [EntryPointPlugin(this.entry, styles, out.outputs)],
        });
    }
}
