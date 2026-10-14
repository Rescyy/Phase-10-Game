import { FileService } from './services/fileService.js';
import path from 'path';

export class Renderer {
    static async serveRenderedTemplate(res, templatePath, model) {
        const template = await FileService.readFile(templatePath, 'utf8');

        const renderedTemplate = Renderer.renderTemplate(template, model);
        
        await res.send(renderedTemplate);
    }

    static async serveRenderedLayoutTemplate(res, templatePath, model) {
        const layoutPath = path.join(FileService.dirname, 'views', 'layout.html');

        const template = await FileService.readFile(templatePath, 'utf8');
        const layout = await FileService.readFile(layoutPath, 'utf8');

        const renderedTemplate = Renderer.renderTemplate(template, model);
        const renderedLayoutTemplate = Renderer.renderTemplate(layout, {content: renderedTemplate, ...model});

        await res.send(renderedLayoutTemplate);
    }

    static buildStylesheetLinks(...stylesheets) {
        return stylesheets.map(stylesheet => `<link rel="stylesheet" href="${stylesheet}">`).join('\n');
    }

    static renderTemplate(template, model) {
        return template.replace(
            /\{\{\s*([\w.]+)\s*\}\}/g,
            (_, key) => {
                const value = key
                    .split(".")
                    .reduce((obj, part) => obj?.[part], model);

                if (typeof value === 'boolean') {
                    return value ? 'true' : 'false';
                }
                return value ?? "";
            }
        );
    }
}

