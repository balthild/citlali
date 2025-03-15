import dedent from 'dedent';
import { configDotenv } from 'dotenv';

import { build } from './build';
import { clean } from './clean';
import { dev } from './dev';
import { ansi } from './utils/ansi';

export function main(command: string, args: string[]) {
    configDotenv();

    switch (command) {
        case 'build':
            return build(args);
        case 'dev':
            return dev(args);
        case 'clean':
            return clean();
        default:
            return help();
    }
}

function help() {
    console.log(dedent`
        A userscripts and userstyles development toolkit

        Usage:
            citlali <command> [OPTIONS]

        Commands:
            ${ansi.bold('dev')}     Watch and build files on change
            ${ansi.bold('build')}   Build files
            ${ansi.bold('clean')}   Delete build outputs
    `);

    process.exit(1);
}
