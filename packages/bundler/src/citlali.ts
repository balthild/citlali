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

/**
 * Rollup doesn't support disabling code splitting, so each
 * entry point needs an individual rollup instance.
 *
 * See https://github.com/rollup/rollup/issues/2756
 */
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
    }

    public async stop() {
        await this.watcher?.close();
    }

    protected async add(entry: EntryName) {
        const output = this.getOutputName(entry);
        if (!output) return;

        const existing = this.bundlers.get(output);
        if (existing) {
            if (existing.entry !== entry) {
                console.warn('Multiple entrypoints compile to same output file:');
                console.warn(existing.entry);
                console.warn(entry);
            }

            return;
        }

        const bundler = new Bundler(this, entry);
        await bundler.start();

        this.bundlers.set(output, bundler);
    }

    protected async remove(entry: EntryName) {
        const output = this.getOutputName(entry);
        if (!output) return;

        const existing = this.bundlers.get(output);
        if (existing?.entry !== entry) {
            return;
        }

        existing.stop();

        this.bundlers.delete(output);
    }

    public getOutputName(entry: EntryName) {
        const ext = extname(entry);
        let name = basename(entry, ext);
        let dir = relative(this.options.src, dirname(entry));

        if (name === 'index.user') {
            name = basename(dir);
            dir = dirname(dir);
        }

        if (/^\.[jt]sx?$/.test(ext)) {
            return join(dir, `${name}.js`);
        }

        if (/^\.s?css$/.test(ext)) {
            return join(dir, `${name}.css`);
        }
    }

    public getOutputPath(entry: EntryName) {
        const name = this.getOutputName(entry);
        if (!name) return;

        return join(this.options.dist, name);
    }

    public getEntryPath(entry: EntryName) {
        return join(this.options.src, entry);
    }
}
