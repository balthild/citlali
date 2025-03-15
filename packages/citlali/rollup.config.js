import { defineRollupConfig } from '@citlali/workspace';

export default defineRollupConfig({
    entrypoints: ['./src/index.ts', './src/citlali.ts'],
});
