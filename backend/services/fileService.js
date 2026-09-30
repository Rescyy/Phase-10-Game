import path from 'path';
import { readFile } from 'node:fs/promises';

export class FileService {
    static fileCache = new Map();

    static initialise(dirname) {
        this.dirname = dirname;
        this.publicPath = path.join(dirname, 'public');
    }

    // make a copy of this if you want to use it
    static async readFile(filePath, encoding) {
        if (this.fileCache.has(filePath)) {
            return this.fileCache.get(filePath);
        }

        const content = await readFile(filePath, encoding);
        this.fileCache.set(filePath, content);
        return content;
    }
}