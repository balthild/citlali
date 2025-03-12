import { spawnSync } from 'child_process';
import { extname } from 'path';
import { fileURLToPath } from 'url';

if (process.isBun) {
    const { main } = await import('@citlali/cli');
    const [command, ...args] = process.argv.slice(2);
    await main(command, args);
} else {
    const url = import.meta.resolve('bun/bin/bun' + extname(process.execPath));
    const result = spawnSync(
        fileURLToPath(url),
        process.argv.slice(1),
        { stdio: 'inherit' },
    );
    process.exit(result.status);
}
