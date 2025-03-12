declare module '*.module.scss' {
    const classes: Record<string, string>;
    export default classes;
    export const cssText: string;
}

declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
    export const cssText: string;
}

declare module '*.css' {
    export const cssText: string;
}

declare module '*.scss' {
    export const cssText: string;
}
