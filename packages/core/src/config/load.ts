import { access, constants } from "fs/promises";
import { pathToFileURL } from "url";
import { loadBundledModule } from "../utils/module";
import { CitlaliOptions, ResolvedCitlaliOptions } from "./options";

export async function loadConfig() {
    try {
        await access('citlali.config.ts', constants.F_OK);

        // @ts-ignore
        const typescript = await import('@rollup/plugin-typescript');
        const module = await loadBundledModule('citlali.config.ts', {
            plugins: [typescript.default()]
        });

        return resolveDefaultConfig(module.default);
    } catch {
        const url = pathToFileURL('citlali.config.js');
        // if (watch) {
        //     url.search = `?${Date.now()}`;
        // }

        const module = await import(url.href);

        return resolveDefaultConfig(module.default);
    }
}

export function resolveDefaultConfig(options?: CitlaliOptions) {
    if (!options) options = {};

    options.input ??= ['src/**/*.user.js', 'src/**/*.user.css'];
    options.output ??= 'dist';
    options.rollup ??= {};

    return options as ResolvedCitlaliOptions;
}
