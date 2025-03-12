import pairs, { CSPair } from 'ansi-styles';

export const ansi = {
    bold: makeAnsiStyle(pairs.bold),
};

function makeAnsiStyle(pair: CSPair) {
    return (text: string) => `${pair.open}${text}${pair.close}`;
}
