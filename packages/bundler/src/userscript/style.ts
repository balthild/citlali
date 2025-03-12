import { BunPlugin, PluginBuilder } from 'bun';
import { transform } from 'lightningcss';
import { compile } from 'sass';

import { StylesEmitter } from './emitter';

export function InlineStylePlugin(styles: StylesEmitter): BunPlugin {
    return {
        name: 'citlali-userscript-inline-style',

        setup(build: PluginBuilder) {
            build.onLoad({ filter: /\.module\.scss$/ }, async (args) => {
                const module = compile(args.path);

                const { code, exports } = transform({
                    filename: args.path,
                    cssModules: true,
                    code: Buffer.from(module.css),
                });

                styles.emit(code);

                const names = Object.fromEntries(
                    Object.entries(exports ?? {}).map(([key, value]) => [
                        key,
                        value.name,
                    ]),
                );

                return {
                    exports: names,
                    loader: 'object',
                };
            });

            build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
                const { code, exports } = transform({
                    filename: args.path,
                    cssModules: true,
                    code: await Bun.file(args.path).bytes(),
                });

                styles.emit(code);

                const names = Object.fromEntries(
                    Object.entries(exports ?? {}).map(([key, value]) => [
                        key,
                        value.name,
                    ]),
                );

                return {
                    exports: names,
                    loader: 'object',
                };
            });
        },
    };
}
