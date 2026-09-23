import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

export function initialiseEndpoints(app, dirname) {
    const publicPath = path.join(dirname, 'public');

    app.use(express.static(publicPath));

    app.get('/game', (req, res) => {
        const gameViewPath = path.join(publicPath, 'views', 'game.html');
        res.sendFile(gameViewPath);
    });
}