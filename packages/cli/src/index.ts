import chalk from 'chalk';
import { configDotenv } from 'dotenv';

import { dedent } from '@citlali/utils';

import { build } from './build';
import { clean } from './clean';
import { dev } from './dev';

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
            ${chalk.bold('dev')}     Watch and build files on change
            ${chalk.bold('build')}   Build files
            ${chalk.bold('clean')}   Delete build outputs
    `);

    process.exit(1);
}
