import { basename, dirname, extname, join, relative } from 'path';

import { FSWatcher, watch } from 'chokidar';
import micromatch from 'micromatch';

import { CitlaliOptions } from '@citlali/core';

import { Bundler } from './bundler';

export interface CitlaliArgs {
    dev: boolean;
    watch: boolean;
}

type OutputName = string;
type EntryName = string;

export class Citlali {
    protected watcher?: FSWatcher;

    protected bundlers: Map<OutputName, Bundler> = new Map();

    constructor(
        public readonly options: CitlaliOptions,
        public readonly args: CitlaliArgs,
    ) {}

    public async start() {
        const watcher = this.watcher = watch(this.options.src, {
            persistent: this.args.watch,
            ignored: (path, stats) => {
                if (!stats?.isFile()) return false;

                for (const pattern of this.options.entrypoints) {
                    const options = { basename: !pattern.includes('/') };
                    if (micromatch.isMatch(path, pattern, options)) {
                        return false;
                    }
                }

                return true;
            },
        });

        watcher.on('add', (path) => this.add(path));
        watcher.on('unlink', (path) => this.remove(path));
        watcher.on('change', (path) => this.update(path));

        return new Promise((resolve, reject) => {
            return watcher.on('ready', () => this.fresh().then(resolve, reject));
        });
    }

    public async stop() {
        await this.watcher?.close();
    }

    protected async add(entry: EntryName) {
        const output = this.getOutputName(entry);
        if (!output) return;

        const existing = this.bundlers.get(output);
        if (existing) {
            console.warn('Multiple entrypoints compile to same output file:', existing, entry);
            return;
        }

        this.bundlers.set(output, new Bundler(this, entry));
    }

    protected async remove(entry: EntryName) {
        const output = this.getOutputName(entry);
        if (!output) return;

        const existing = this.bundlers.get(output);
        if (!existing || existing.entry !== entry) {
            return;
        }

        this.bundlers.delete(output);
    }

    protected async update(path: string) {
        for (const bundler of this.bundlers.values()) {
            await bundler.trigger(path);
        }
    }

    protected async fresh() {
        for (const bundler of this.bundlers.values()) {
            await bundler.build();
        }
    }

    public getOutputName(entry: EntryName) {
        const ext = extname(entry);
        let name = basename(entry, ext);
        let dir = relative(this.options.src, dirname(entry));

        if (name === 'index.user') {
            name = basename(dir);
            dir = dirname(dir);
        }

        switch (ext) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
                return join(dir, `${name}.js`);

            case '.css':
            case '.scss':
                return join(dir, `${name}.css`);
        }
    }
}
