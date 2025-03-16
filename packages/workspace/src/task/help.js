import dedent from 'dedent';

export default function help() {
    console.log(dedent`
        Citlali Workspace Scripts

        Usage:
            citlali-workspace rollup [rollup options]
            citlali-workspace clean
    `);
}
