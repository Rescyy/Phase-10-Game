import path from 'path';
import { readFile } from 'node:fs/promises';

export class FileService {
    static fileCache = new Map();
    static caching = false;

    static initialise(dirname) {
        this.dirname = dirname;
        this.publicPath = path.join(dirname, 'public');
    }

    // make a copy of this if you want to use it
    static async readFile(filePath, encoding) {
        if (FileService.caching && this.fileCache.has(filePath)) {
            return this.fileCache.get(filePath);
        }

        const content = await readFile(filePath, encoding);
        this.fileCache.set(filePath, content);
        return content;
    }

    static getViewPath(fileName) {
        return path.join(FileService.dirname, 'views', fileName);
    }

    static async getViewContent(fileName) {
        return await FileService.readFile(FileService.getViewPath(fileName), 'utf-8');
    }
}