import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from './src/server/app';
import { SERVER_PORT, SERVER_HOST } from './src/config/serverConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = await startServer(path.join(__dirname, 'dist'), SERVER_PORT, SERVER_HOST);

console.log(`Server listening on ${server.url}`);

const shutdown = async () => {
  await server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
