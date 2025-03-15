import { main } from '@citlali/cli';
const [command, ...args] = process.argv.slice(2);
await main(command, args);
