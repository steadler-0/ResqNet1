import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { initStore } from './src/store.js';
import { initFirebase } from './src/services/firebase.js';
import { createApiRouter } from './src/routes/api.js';
import { registerSocketHandlers } from './src/socket.js';

const PORT = Number(process.env.PORT) || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
      else cb(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
});

registerSocketHandlers(io);
app.use('/api', createApiRouter(io));

await initStore();
await initFirebase();

server.listen(PORT, () => {
  console.log(`[RescueNet] API + Socket.io on http://localhost:${PORT}`);
});
