#!/usr/bin/env node
import help from './task/help.js';

await main();

async function main() {
    const [_exec, _script, task, ...args] = process.argv;

    const module = await loadTaskModule(task);
    if (typeof module.default === 'function') {
        await module.default(...args);
    }
}

/**
 * @param {string} task
 */
async function loadTaskModule(task) {
    try {
        if (!task) throw new Error('No task specified');
        return await import(`./task/${task}.js`);
    } catch {
        help();
        process.exit(1);
    }
}
