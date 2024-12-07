import { RollupOptions } from "rollup";
import { ExplicitPartial } from "../types/utils";

export type RollupOptionsCustom = Pick<RollupOptions, 'external' | 'jsx' | 'plugins' | 'treeshake'>;
export type RollupOptionsOverride = ExplicitPartial<Omit<RollupOptionsCustom, 'plugins'>>;

export interface CitlaliOptions {
    /**
     * The entry points.
     * Default: `['src/**\/*.user.js', 'src/**\/*.user.css']`
     */
    input?: string | string[],

    /**
     * The build output directory.
     * Default: `'dist'`
     */
    output?: string,

    /**
     * Custom rollup configutation.
     * Default: `{}`
     */
    rollup?: RollupOptionsCustom,
}

export type ResolvedCitlaliOptions = Required<CitlaliOptions>;

export function defineConfig(options: CitlaliOptions): CitlaliOptions {
    return options;
}
