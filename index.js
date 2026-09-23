import express from 'express';
import { initialiseEndpoints } from "./backend/endpoints.js";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
initialiseEndpoints(app, __dirname);


app.listen(12345);