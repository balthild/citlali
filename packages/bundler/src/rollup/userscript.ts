import { fileURLToPath } from 'url';

import { transform } from 'lightningcss';
import { Plugin, PluginContext } from 'rollup';
import { compile } from 'sass';

import { UserscriptOptions } from '@citlali/core';
import { cleanEntryCode, evalModuleCode } from '@citlali/utils';

import { Bundler } from '../bundler';

export function UserscriptPlugin(bundler: Bundler): Plugin {
    return {
        name: 'citlali-rollup-userscript',

        resolveId(source, importer, options) {
            if (source === 'citlali:entrypoint') {
                return bundler.entry;
            }

            if (source.startsWith('citlali:')) {
                return source;
            }
        },

        load(id) {
            if (id === 'citlali:userscript') {
                return /* javascript */ `
                    import userscript from 'citlali:entrypoint';
                    userscript.main();
                `;
            }
        },

        transform(code, id) {
            if (/\.s?css$/.test(id)) {
                return transformStyle(this, code, id);
            }
        },

        async banner(chunk) {
            const entry = this.getModuleInfo(bundler.entry)!;
            const clean = cleanEntryCode(entry.code!);
            const module = await evalModuleCode(bundler.entry, clean.code);
            const options = module.default as UserscriptOptions;

            return [
                `// ==UserScript==`,

                bannerLine('name', options.name),
                bannerLine('description', options.description ?? ''),
                bannerLine('version', options.version),
                bannerLine('author', options.author),
                bannerLine('namespace', options.namespace ?? 'Built with Citlali'),

                ...(options.match?.length ? options.match : ['*://*/*'])
                    .map((match) => bannerLine('match', match)),

                ...(options.grant?.length ? options.grant : ['none'])
                    .map((grant) => bannerLine('grant', grant)),

                `// ==/UserScript==`,
            ].join('\n');
        },
    };
}

function transformStyle(ctx: PluginContext, code: string, id: string) {
    if (id.endsWith('.scss')) {
        code = transformSCSS(ctx, code, id);
    }

    if (!/\.module\.s?css$/.test(id)) {
        return injectStyle(this, code, id);
    }

    const module = transform({
        filename: id,
        cssModules: true,
        code: Buffer.from(code),
    });

    const names = Object.fromEntries(
        Object.entries(module.exports ?? {})
            .map(([key, value]) => [key, value.name]),
    );

    return /* javascript */ `
        const classes = ${JSON.stringify(names, undefined, 2)};
        export default classes;

        ${injectStyle(ctx, code, id)}
    `;
}

function transformSCSS(ctx: PluginContext, code: string, id: string) {
    const result = compile(id);

    result.loadedUrls
        .filter((x) => x.protocol === 'file')
        .map((x) => fileURLToPath(x))
        .forEach((x) => ctx.addWatchFile(x));

    return result.css;
}

function injectStyle(ctx: PluginContext, code: string, id: string) {
    return /* javascript */ `
        export const cssText = ${toRawStringLiteral(code)};

        const style = document.createElement('style');
        style.id = ${toRawStringLiteral(id)}
        style.textContent = cssText;
        document.head.appendChild(style);
    `;
}

function toRawStringLiteral(value: string) {
    const escaped = value.replace(/[`\\]/g, (ch) => {
        switch (ch) {
            case '\\':
                return '\\\\';
            case '`':
                return '\\`';
            default:
                return ch;
        }
    });

    return `\`${escaped}\``;
}

function bannerLine(name: string, value: string) {
    return `// @${name.padEnd(12)} ${value}`;
}
