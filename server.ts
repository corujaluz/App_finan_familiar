import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'heckler_family_database.json');

// SSE clients set for real-time push to all users
const sseClients = new Set<Response>();

// Helper to broadcast events to all active clients
function broadcastEvent(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (err) {
      console.error('Error writing to SSE client:', err);
      sseClients.delete(client);
    }
  }
}

// Read database from disk
function readDatabase(): any | null {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

// Write database to disk atomically
function writeDatabase(data: any): boolean {
  try {
    const tempFile = `${DB_FILE}.tmp_${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error saving database file:', err);
    return false;
  }
}

// 1. Get canonical finance database
app.get('/api/finance-data', (req: Request, res: Response) => {
  const db = readDatabase();
  if (db) {
    return res.json({
      success: true,
      data: db.state || db,
      lastUpdated: db.lastUpdated || new Date().toISOString(),
      savedBy: db.savedBy || 'Sistema',
      version: db.version || 1,
    });
  }
  return res.json({
    success: false,
    message: 'Nenhum banco de dados persistido ainda no servidor. O cliente inicializará.',
  });
});

// 2. Save canonical finance database & broadcast immediately in real time
app.post('/api/finance-data', (req: Request, res: Response) => {
  try {
    const { state, savedBy = 'Usuário', savedAt = new Date().toLocaleTimeString('pt-BR') } = req.body;
    if (!state) {
      return res.status(400).json({ success: false, message: 'Estado inválido.' });
    }

    const currentDb = readDatabase();
    const version = (currentDb?.version || 0) + 1;
    const nowIso = new Date().toISOString();

    const dbRecord = {
      state,
      savedBy,
      savedAt,
      lastUpdated: nowIso,
      version,
    };

    const saved = writeDatabase(dbRecord);
    if (!saved) {
      return res.status(500).json({ success: false, message: 'Falha ao gravar no disco.' });
    }

    // Broadcast immediately to all connected browsers/devices (Eduardo & Graciela)
    broadcastEvent('DATA_UPDATED', {
      state,
      savedBy,
      savedAt,
      lastUpdated: nowIso,
      version,
    });

    return res.json({
      success: true,
      lastUpdated: nowIso,
      version,
      savedBy,
      savedAt,
    });
  } catch (err) {
    console.error('Erro na rota POST /api/finance-data:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// 3. Real-Time Server-Sent Events (SSE) stream
app.get('/api/finance-sync', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(': connected\n\n');
  res.write(`event: INITIAL_STATE\ndata: ${JSON.stringify({ message: 'Conexão em tempo real estabelecida com sucesso' })}\n\n`);

  sseClients.add(res);

  // Keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 4. Reset canonical database to demo
app.post('/api/finance-reset', (req: Request, res: Response) => {
  try {
    const { defaultState, resetBy = 'Eduardo Heckler (Admin)' } = req.body;
    if (defaultState) {
      const nowIso = new Date().toISOString();
      const dbRecord = {
        state: defaultState,
        savedBy: resetBy,
        savedAt: new Date().toLocaleTimeString('pt-BR'),
        lastUpdated: nowIso,
        version: 1,
      };
      writeDatabase(dbRecord);

      broadcastEvent('DATA_UPDATED', {
        state: defaultState,
        savedBy: resetBy,
        savedAt: dbRecord.savedAt,
        lastUpdated: nowIso,
        version: 1,
      });
    } else if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }

    return res.json({ success: true, message: 'Dados resetados com sucesso.' });
  } catch (err) {
    console.error('Erro ao resetar dados:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Heckler Family] Full-stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
