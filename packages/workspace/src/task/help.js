import dedent from 'dedent';

export default function help() {
    console.log(dedent`
        Citlali Workspace Scripts

        Usage:
            citlali-workspace dev [...entrypoints]
            citlali-workspace build [...entrypoints]
            citlali-workspace clean
    `);
}
