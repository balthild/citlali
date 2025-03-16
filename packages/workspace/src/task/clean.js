import { rm } from 'fs/promises';

export default async function main() {
    await rm('./dist', {
        force: true,
        recursive: true,
    });
}
