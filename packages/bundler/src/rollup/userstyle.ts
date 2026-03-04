import { fileURLToPath } from 'url';

import chalk from 'chalk';
import {
    AtrulePlain,
    CssNodePlain,
    DeclarationPlain,
    fromPlainObject,
    generate,
    parse,
    StyleSheetPlain,
    toPlainObject,
} from 'css-tree';
import { Plugin, PluginContext } from 'rollup';
import { compileString } from 'sass';

import { Bundler } from '../bundler';

interface UserstyleEntry {
    id: string;
    code: string;
    ast: StyleSheetPlain;
}

export function UserstylePlugin(bundler: Bundler): Plugin {
    const entry = {} as UserstyleEntry;

    return {
        name: 'citlali-rollup-userstyle',

        resolveId(source, importer, options) {
            if (source.startsWith('citlali:')) {
                return source;
            }
        },

        load(id) {
            if (id === 'citlali:entrypoint') {
                return this.load({ id: bundler.entry });
            }
        },

        transform(code, id) {
            if (id === bundler.entry) {
                const ast = parse(code);
                if (ast.type !== 'StyleSheet') {
                    console.log(chalk.red(chalk.bold(entry.id), 'is not a valid stylesheet'));
                    this.error(`${entry.id} is not a valid stylesheet`);
                }

                entry.id = id;
                entry.code = code;
                entry.ast = toPlainObject(ast) as StyleSheetPlain;

                return 'placeholder();';
            }
        },

        async renderChunk(code, chunk, options, meta) {
            if (chunk.facadeModuleId !== 'citlali:entrypoint') {
                return;
            }

            return transformUserstyle(this, entry);
        },
    };
}

interface UserstyleMetadataRule extends AtrulePlain {
    name: '-citlali-userstyle';
}

function isMetadata(node: CssNodePlain): node is UserstyleMetadataRule {
    return node.type === 'Atrule' && node.name === '-citlali-userstyle';
}

interface UserstyleDocumentRule extends AtrulePlain {
    name: '-moz-document';
}

function isDocument(node: CssNodePlain): node is UserstyleDocumentRule {
    return node.type === 'Atrule' && node.name === '-moz-document';
}

function transformUserstyle(ctx: PluginContext, entry: UserstyleEntry) {
    const output = [];
    output.push(...renderBanner(ctx, entry));
    output.push('');

    const body = entry.ast.children.filter((node) => !isMetadata(node));

    for (const [index, node] of body.entries()) {
        if (!isDocument(node)) {
            continue;
        }

        if (node.prelude.type === 'AtrulePrelude') {
            for (const item of node.prelude.children) {
                if (item.type === 'Operator' && item.value === ',') {
                    item.value = ', ';
                }
            }
        }

        const prelude = generate(fromPlainObject(node.prelude));

        const combined = generate(fromPlainObject({
            type: 'StyleSheet',
            children: [
                ...body.slice(0, index).filter((it) => !isDocument(it)),
                ...node.block.children,
                ...body.slice(index + 1).filter((it) => !isDocument(it)),
            ],
        }));

        const result = compileString(combined);

        output.push(`@-moz-document ${prelude} {`);
        output.push(...result.css.split('\n').map((line) => line ? '  ' + line : ''));
        output.push('}');
        output.push('');

        result.loadedUrls
            .filter((x) => x.protocol === 'file')
            .map((x) => fileURLToPath(x))
            .forEach((x) => ctx.addWatchFile(x));
    }

    return output.join('\n');
}

function renderBanner(ctx: PluginContext, entry: UserstyleEntry) {
    const rule = entry.ast.children.find((node) => isMetadata(node));
    if (!rule) {
        console.log(chalk.red('Missing', chalk.bold('@-citlali-userstyle'), 'in', chalk.bold(entry.id)));
        ctx.error(`Missing @-citlali-userstyle in ${entry.id}`);
    }

    return [
        `/* ==UserStyle==`,
        bannerLine(rule, 'name'),
        bannerLine(rule, 'description', ''),
        bannerLine(rule, 'version'),
        bannerLine(rule, 'author'),
        bannerLine(rule, 'namespace', 'Built with Citlali'),
        `==/UserStyle== */`,
    ];
}

function bannerLine(rule: UserstyleMetadataRule, name: string, fallback: string = '') {
    const decl = rule.block.children.find((node): node is DeclarationPlain => {
        return node.type === 'Declaration' && node.property === name;
    });

    if (decl.value.type !== 'Value') {
        return fallback;
    }

    const first = decl.value.children[0] ?? {} as any;
    const value = first.value ?? fallback;

    return `@${name.padEnd(12)} ${value}`;
}
