import { Server } from 'http';
import { basename, dirname, extname, join, relative } from 'path';

import { FSWatcher, watch } from 'chokidar';
import { createServer } from 'http-server';
import micromatch from 'micromatch';

import { CitlaliOptions } from '@citlali/core';

import { Bundler } from './bundler';

export interface CitlaliArgs {
    serve: boolean;
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
    protected server?: Server;
    protected watcher?: FSWatcher;
    protected bundlers: Map<OutputName, Bundler> = new Map();

    constructor(
        public readonly options: CitlaliOptions,
        public readonly args: CitlaliArgs,
    ) {}

    public async start() {
        this.server = this.serve();
        this.watcher = this.watch();
    }

    public async stop() {
        await this.watcher?.close();
        await new Promise<void>((resolve, reject) => {
            this.server?.close((err) => err ? reject(err) : resolve());
        });
    }

    protected serve() {
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ Running dev server on http://localhost:3000 │');
        console.log('└─────────────────────────────────────────────┘');

        const server = createServer({ root: this.options.dist });
        server.listen(3000);
        return server;
    }

    protected watch() {
        const watcher = watch(this.options.src, {
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

        return watcher;
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
            name = basename(dir) + '.user';
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
