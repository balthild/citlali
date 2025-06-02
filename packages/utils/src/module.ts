import { readFile } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { unlink } from 'fs/promises';
import { isAbsolute } from 'path';
import { pathToFileURL } from 'url';

import { Plugin, rolldown } from 'rolldown';

import { dedent } from './text';

export async function ensureDependencies(...deps: string[]) {
    const results = await Promise.allSettled(deps.map((x) => import(x)));

    const missing = results.entries()
        .filter(([i, x]) => x.status === 'rejected')
        .map(([i, x]) => deps[i])
        .toArray();

    if (missing.length > 0) {
        throw new Error(dedent`
            Missing build dependencies. Please install them:
                yarn add --dev ${missing.join(' ')}
        `);
    }
}

export async function evalModule<T = any>(path: string): Promise<T> {
    const code = await readFile(path, { encoding: 'utf-8' });
    return evalModuleCode(path, code);
}

export async function evalModuleCode<T = any>(path: string, code: string): Promise<T> {
    const plugins = [EvalPlugin(path, code)];

    const build = await rolldown({
        plugins,
        input: `citlali:eval:${path}`,
        treeshake: true,
        external: (id: string) => (id[0] !== '.' && !isAbsolute(id)) || id.slice(-5) === '.json',
    });

    const bundle = await build.generate({
        exports: 'named',
        format: 'es',
    });

    return evalJsModuleCode(path, bundle.output[0].code);
}

export async function evalJsModuleCode<T = any>(path: string, code: string): Promise<T> {
    const tmp = `${path}.${Date.now()}.mjs`;

    try {
        await writeFile(tmp, code);
        return await import(pathToFileURL(tmp).href);
    } finally {
        unlink(tmp).catch((error) => console.warn(error?.message || error));
    }
}

function EvalPlugin(path: string, code: string): Plugin {
    return {
        name: 'citlali-rollup-eval',

        resolveId(source, importer, options) {
            if (source === `citlali:eval:${path}`) {
                return source;
            }
        },

        load(id) {
            if (id === `citlali:eval:${path}`) {
                return code;
            }
        },
        // https://github.com/rolldown/rolldown/issues/819
        // https://github.com/rolldown/rolldown/issues/3301
        /*
        resolveImportMeta(property, { moduleId }) {
            const meta = {
                url: pathToFileURL(moduleId).href,
                filename: moduleId,
                dirname: dirname(moduleId),
            };

            if (property == null) {
                return JSON.stringify(meta);
            }

            if (meta.hasOwnProperty(property)) {
                return meta[property as keyof typeof meta];
            }
        },
        */
    };
}
