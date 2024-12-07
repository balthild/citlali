export async function main() {
    const module = await forward(process.argv[2]);
    module.main(process.argv.slice(3));
}

function forward(command: string) {
    switch (command) {
        case 'build':
            return import('./build');
        case 'dev':
            return import('./dev');
        case 'clean':
            return import('./clean');
        default:
            return import('./help');
    }
}
