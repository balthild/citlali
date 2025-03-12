import { BuildArtifact, BunPlugin, PluginBuilder } from 'bun';
import dedent from 'dedent';
import { escapeRegExp } from 'lodash-es';

import { UserscriptOptions } from '@citlali/core';
import { evalJsModuleCode } from '@citlali/utils';

import { StylesEmitter } from './emitter';

export function EntryPointPlugin(entry: string, styles: StylesEmitter, artifacts: BuildArtifact[]): BunPlugin {
    return {
        name: 'citlali-userscript-entry-point',

        async setup(build: PluginBuilder) {
            const main = artifacts.find((output) => output.kind === 'entry-point')!;
            const module = await evalJsModuleCode(main.path, await main.text());
            const options: UserscriptOptions = module.default;

            build.config.banner = dedent`
                // ==UserScript==
                // @name         ${options.name}
                // @description  ${options.description}
                // @version      ${options.version}
                // @author       ${options.author}
                // @namespace    ${options.namespace}
                // @match        ${options.match ?? '*://*/*'}
                // @grant        ${options.grant ?? 'none'}
                // ==/UserScript==
            `;

            build.onResolve({ filter: /^citlali:.+$/ }, (args) => {
                return {
                    path: args.path.substring('citlali:'.length),
                    namespace: 'citlali',
                };
            });

            build.onLoad({ filter: new RegExp(escapeRegExp(entry)) }, (args) => {
                const css = styles.getText().replace(/[`\\]/g, (ch) => {
                    switch (ch) {
                        case '\\':
                            return '\\\\';
                        case '`':
                            return '\\`';
                        default:
                            return ch;
                    }
                });

                return {
                    contents: `
                        import userscript from 'citlali:main';

                        const style = document.createElement('style');
                        style.textContent = \`${css}\`;
                        document.head.appendChild(style);

                        userscript.main();
                    `,
                    loader: 'js',
                };
            });

            build.onLoad({ namespace: 'citlali', filter: /^main$/ }, async (args) => {
                return {
                    contents: await main.text(),
                    loader: 'js',
                };
            });
        },
    };
}
