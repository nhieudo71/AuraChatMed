import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatStream, handleTranscribeAudio, handleFetchModels, handleTestModel } from './src/services/geminiServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API endpoints
app.post('/api/chat/stream', (req, res) => handleChatStream(req, res));
app.post('/api/transcribe', (req, res) => handleTranscribeAudio(req, res));
app.post('/api/models/fetch', (req, res) => handleFetchModels(req, res));
app.post('/api/models/test', (req, res) => handleTestModel(req, res));

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
