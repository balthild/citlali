import { pathToFileURL } from 'url';

import FastGlob from 'fast-glob';

import { evalModule } from '@citlali/utils';
import { AsyncGetter, ExplicitPartial } from '@citlali/utils';

export interface CitlaliOptions {
    /**
     * The `micromatch` pattern of entry points.
     * Default: `['*.user.{js,jsx,ts,tsx,css,scss}']`
     */
    entrypoints: string[];

    /**
     * The source directory.
     * Default: `'src'`
     */
    src: string;

    /**
     * The build output directory.
     * Default: `'dist'`
     */
    dist: string;

    /**
     * Minify the output files.
     * Default: `false`
     */
    minify: false;
}

export type CitlaliOptionsDefinition = Partial<CitlaliOptions> | AsyncGetter<Partial<CitlaliOptions>>;

export async function loadConfig() {
    const paths = await FastGlob('citlali.config.{js,ts}');
    if (paths.length > 1) {
        throw new Error('Multiple config files found. Please keep only one or specify which config to use.');
    }

    const [path] = paths;
    if (!path) {
        return resolveConfig();
    }

    if (path.endsWith('.js')) {
        const url = pathToFileURL(path);
        const module = await import(url.href);
        return resolveConfig(module.default);
    }

    const module = await evalModule(path);

    return resolveConfig(module.default);
}

async function resolveConfig(definition: CitlaliOptionsDefinition = {}) {
    if (typeof definition === 'function') {
        definition = await definition();
    }

    const options: CitlaliOptions = {
        entrypoints: ['*.user.{js,jsx,ts,tsx,css,scss}'],
        src: 'src',
        dist: 'dist',
        minify: false,
    };

    for (const [key, value] of Object.entries(definition)) {
        if (value !== undefined && options.hasOwnProperty(key)) {
            options[key as keyof CitlaliOptions] = value as never;
        }
    }

    return options;
}
