import { pathToFileURL } from 'url';

export async function ensureDependencies(...deps: string[]) {
    const results = await Promise.allSettled(deps.map((x) => import(x)));

    const missing: string[] = [];
    for (const [i, result] of results.entries()) {
        if (result.status === 'rejected') {
            missing.push(deps[i]);
        }
    }

    if (missing.length > 0) {
        throw new Error('Missing dependency. Please install them:\n  bun add ' + missing.join(' '));
    }
}

export async function evalModule<T = any>(path: string): Promise<T> {
    const input = await Bun.file(path).bytes();
    return evalModuleCode(path, input);
}

export async function evalModuleCode<T = any>(path: string, code: string | Uint8Array): Promise<T> {
    const transpiler = new Bun.Transpiler({ target: 'bun' });
    const output = await transpiler.transform(code);

    return evalJsModuleCode(path, output);
}

export async function evalJsModuleCode<T = any>(path: string, code: string): Promise<T> {
    const tmp = `${path}.${Date.now()}.mjs`;

    const module = Bun.file(tmp);
    await module.write(code);

    try {
        return await import(pathToFileURL(tmp).href);
    } finally {
        module.delete().catch((error) => console.warn(error?.message || error));
    }
}

/*
function rollupPluginImportMeta(): Plugin {
    return {
        name: 'citlali-rollup-import-meta',
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
    };
}
*/
