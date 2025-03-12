export class StylesEmitter {
    protected styles: Uint8Array[];

    constructor() {
        this.styles = [];
    }

    emit(css: Uint8Array) {
        return this.styles.push(css);
    }

    getText() {
        const decoder = new TextDecoder();
        return this.styles.map((css) => decoder.decode(css)).join('\n');
    }
}
