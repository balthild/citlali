import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

export default function main(...args) {
    console.log('rollup', ...args);

    const rollup = fileURLToPath(import.meta.resolve('rollup/dist/bin/rollup'));
    spawnSync(process.execPath, [rollup, ...args], {
        stdio: 'inherit',
    });
}
