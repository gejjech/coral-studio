import http from 'http';
import express from 'express';
import { handler } from '../build/handler.js';
import { injectSocketIO } from './socketio.js';

const app = express();
const server = http.createServer(app);

globalThis.socketSecret = crypto.randomUUID();

// Inject SocketIO
injectSocketIO(server);

// SvelteKit handlers
app.use(handler);

const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => {
	console.log(`Running on ${host}:${port}`);
});
