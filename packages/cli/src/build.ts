import { Citlali } from '@citlali/bundler';
import { loadConfig } from '@citlali/core';

export async function build(args: string[]) {
    const options = await loadConfig();
    const bundler = new Citlali(options, {
        dev: false,
        watch: false,
    });

    await bundler.start();
}
