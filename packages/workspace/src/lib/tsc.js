import { join } from 'path';

import ts from 'typescript';

export async function tscWatch() {
    const system = createSystem();
    const creator = ts.createSemanticDiagnosticsBuilderProgram;
    const reporter = createDiagnosticReporter(system);
    const host = ts.createWatchCompilerHost('tsconfig.json', {}, system, creator, reporter);
    return ts.createWatchProgram(host);
}

export async function tscTypecheck() {
    const system = createSystem();
    const reporter = createDiagnosticReporter(system);
    const tsconfig = parseTsconfig(system, reporter);

    let program = ts.createProgram(tsconfig.fileNames, tsconfig.options);
    let result = program.emit();

    let diagnostics = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);
    diagnostics.forEach(reporter);
}

/**
 * @param {ts.System} system
 * @param {ts.DiagnosticReporter} reporter
 * @returns {ts.ParsedCommandLine}
 */
function parseTsconfig(system, reporter) {
    return ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, {
        ...system,
        onUnRecoverableConfigFileDiagnostic: reporter,
    });
}

/**
 * @returns {ts.System}
 */
function createSystem() {
    return {
        ...ts.sys,
        fileExists(path) {
            return path === 'tsconfig.json' || ts.sys.fileExists(path);
        },
        readFile(path, encoding) {
            if (path === 'tsconfig.json' && !ts.sys.fileExists(path)) {
                path = join(import.meta.dirname, '..', '..', path);
            }

            return ts.sys.readFile(path, encoding);
        },
    };
}

/**
 * @param {ts.System} system
 * @returns {ts.DiagnosticReporter}
 */
function createDiagnosticReporter(system) {
    // @ts-expect-error
    return ts.createDiagnosticReporter(system, true);
}
