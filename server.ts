import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import { apiRouter, setEventBroadcaster } from './src/backend/modules/index.js';
import { runBackendIntegrationTests } from './src/backend/tests/integration.test.js';
import { realtimeGateway } from './src/packages/realtime-engine/index.js';

const app = express();
const PORT = 3000;
const httpServer = createHttpServer(app);

// Body parser configurations for base64 camera photo uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// --- SERVER-SENT EVENTS (SSE) ROUTE ---
interface SSEClient {
  id: string;
  res: any;
}
let sseClients: SSEClient[] = [];

app.get('/api/player/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Math.random().toString(36).substring(2, 15);
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial connected statement
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Broadcast live notification callback
function broadcastSSE(payload: any) {
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      sseClients = sseClients.filter(c => c.id !== client.id);
    }
  });
}

// Bind live event broadcaster callback to routing modules
setEventBroadcaster(broadcastSSE);

// Mount production-ready modular api Router
app.use(apiRouter);
app.use('/api', apiRouter);

// --- INTEGRATE VITE DEV SERVER OR SERVE STATIC BUILD ---
async function startServer() {
  // Run integration tests on boot
  runBackendIntegrationTests();

  // Attach Realtime Socket.IO Engine Gateway
  realtimeGateway.attach(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[BOOT SUCCESS] Unified Server is listening on http://localhost:${PORT}`);
  });
}

startServer();
