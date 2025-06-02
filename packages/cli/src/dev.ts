import { Citlali } from '@citlali/bundler';
import { loadConfig } from '@citlali/core';

export async function dev(args: string[]) {
    const options = await loadConfig();
    const bundler = new Citlali(options, {
        serve: true,
        watch: true,
    });

    await bundler.start();
}
