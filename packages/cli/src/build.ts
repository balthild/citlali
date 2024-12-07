import { start } from '@citlali/core/bundler';

export async function main(args: string[]) {
    console.log('build')
    await start();
}
