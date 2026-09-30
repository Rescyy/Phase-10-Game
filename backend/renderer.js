import { FileService } from './services/fileService.js';
import path from 'path';

export class Renderer {
    static async serveRenderedTemplate(res, templatePath, model) {
        const template = await FileService.readFile(templatePath, 'utf8');

        const renderedTemplate = renderTemplate(template, model);
        
        await res.send(renderedTemplate);
    }

    static async serveRenderedLayoutTemplate(res, templatePath, model) {
        const layoutPath = path.join(FileService.dirname, 'views', 'layout.html');

        const template = await FileService.readFile(templatePath, 'utf8');
        const layout = await FileService.readFile(layoutPath, 'utf8');

        const renderedTemplate = renderTemplate(template, model);
        const renderedLayoutTemplate = renderTemplate(layout, {content: renderedTemplate});

        await res.send(renderedLayoutTemplate);
    }
}

function renderTemplate(template, model) {
    return template.replace(
        /\{\{\s*([\w.]+)\s*\}\}/g,
        (_, key) => {
            const value = key
                .split(".")
                .reduce((obj, part) => obj?.[part], model);

            return value ?? "";
        }
    );
}