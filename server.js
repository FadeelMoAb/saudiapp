import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// API handlers
import phrases        from './api/phrases.js';
import suggest        from './api/suggest.js';
import suggestions    from './api/suggestions.js';
import approve        from './api/approve.js';
import reject         from './api/reject.js';
import speak          from './api/speak.js';
import updateSuggestion from './api/update-suggestion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// API routes
app.get('/api/phrases',            (req, res) => phrases(req, res));
app.post('/api/suggest',           (req, res) => suggest(req, res));
app.get('/api/suggestions',        (req, res) => suggestions(req, res));
app.post('/api/approve',           (req, res) => approve(req, res));
app.post('/api/reject',            (req, res) => reject(req, res));
app.post('/api/speak',             (req, res) => speak(req, res));
app.post('/api/update-suggestion', (req, res) => updateSuggestion(req, res));

// Admin page
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));

// Static files (index.html, sw.js, manifest.json, icons, numbers.html, etc.)
app.use(express.static(__dirname));

// Fallback → index.html
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Saudibia running on port ${PORT}`));
