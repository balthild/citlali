/**
 * Similar to the `dedent` package, but ignores newlines in the interpolated values.
 */
export function dedent(template: TemplateStringsArray, ...values: unknown[]): string {
    let indent = Math.min(
        ...template.raw
            .flatMap((x) => x.split('\n').slice(1))
            .filter((x) => x.trim())
            .map((x) => /^ */.exec(x)?.[0] || '')
            .map((x) => x.length),
    );

    const spaces = new RegExp(`(?<=^|\n) {${indent}}`, 'g');
    const raw = template.raw.map((x) => x.replace(spaces, ''));

    return String.raw({ ...template, raw }, ...values);
}

export const javascript = dedent;
export const css = dedent;
export const html = dedent;
