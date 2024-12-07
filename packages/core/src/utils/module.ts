import { unlink, writeFile } from 'fs/promises';
import { dirname, isAbsolute } from 'path';
import { pathToFileURL } from 'url';
import { rollup, Plugin, RollupOptions } from 'rollup';

export async function loadBundledModule(path: string, options: RollupOptions): Promise<any> {
    const build = await rollup({
        ...options,
        external: (id: string) => (id[0] !== '.' && !isAbsolute(id)) || id.slice(-5) === '.json',
        input: path,
        treeshake: false,
    });

    const bundle = await build.generate({
        exports: 'named',
        format: 'es',
        plugins: [rollupPluginImportMeta()]
    });

    console.log(bundle.output[0]);

    return importTemporaryModule(`${path}.${Date.now()}.mjs`, bundle.output[0].code);
}

function rollupPluginImportMeta(): Plugin {
    return {
        name: 'import-meta',
        resolveImportMeta(property, { moduleId }) {
            const meta = {
                url: pathToFileURL(moduleId).href,
                filename: moduleId,
                dirname: dirname(moduleId),
            };

            if (property == null) {
                return JSON.stringify(meta);
            }

            if (meta.hasOwnProperty(property)){
                return meta[property as keyof typeof meta];
            }
        },
    };
}

async function importTemporaryModule(path: string, code: string): Promise<unknown> {
    await writeFile(path, code);

    try {
        return await import(pathToFileURL(path).href);
    } finally {
        unlink(path).catch(error => console.warn(error?.message || error));
    }
}
