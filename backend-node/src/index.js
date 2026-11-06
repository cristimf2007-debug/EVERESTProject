require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const prisma = require('./lib/prisma');
const { securityMiddleware, rateLimiter } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const tracksRoutes = require('./routes/tracks');
const commentsRoutes = require('./routes/comments');
const radioRoutes = require('./routes/radio');
const liveRoutes = require('./routes/live');
const tvRoutes = require('./routes/tv');
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const fansRoutes = require('./routes/fans');
const newsletterRoutes = require('./routes/newsletter');
const contactRoutes = require('./routes/contact');
const visitRoutes = require('./routes/visit');
const notificationsRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const filesRoutes = require('./routes/files');
const channelRoutes = require('./routes/channel');
const gamingRoutes = require('./routes/gaming');
const youtubeRoutes = require('./routes/youtube');
const mediaRoutes = require('./routes/media');
const onlineRoutes = require('./routes/online');
const shareRoutes = require('./routes/share');
const contentRoutes = require('./routes/content');
const searchRoutes = require('./routes/search');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ---------- Middleware ----------
app.use(securityMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);

// ---------- Routes (prefix /api) ----------
app.use('/api/auth', authRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api', commentsRoutes);
app.use('/api/radio', radioRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fans', fansRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/gaming', gamingRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/online', onlineRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/search', searchRoutes);

// ---------- WebSocket Chat ----------
const wss = new WebSocketServer({ server, path: '/api/ws/chat', maxPayload: 4096 });
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (origin && !corsOrigins.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }
  let messageTimes = [];
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data?.type === 'chat' && typeof data.message === 'string') {
        const message = data.message.trim();
        if (!message || message.length > 1000) {
          ws.close(1008, 'Invalid message');
          return;
        }
        const now = Date.now();
        messageTimes = messageTimes.filter((time) => now - time < 10000);
        if (messageTimes.length >= 8) {
          ws.close(1008, 'Rate limit exceeded');
          return;
        }
        messageTimes.push(now);
        const broadcast = JSON.stringify({
          type: 'chat',
          username: typeof data.username === 'string' ? data.username.trim().slice(0, 40) || 'Anonim' : 'Anonim',
          message,
          created_at: new Date().toISOString(),
        });
        wss.clients.forEach((client) => {
          if (client.readyState === 1 /* WebSocket.OPEN */) client.send(broadcast);
        });
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });
  ws.on('close', () => {});
  ws.send(JSON.stringify({ type: 'system', message: 'Conectat la chat' }));
});

// ---------- Health ----------
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'bioxic-backend' }));

// ---------- Error handler ----------
app.use(errorHandler);

// ---------- Startup ----------
async function start() {
  try {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 bytes');
    }
    if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
      throw new Error('CORS_ORIGINS must be configured in production');
    }
    // Conectare la baza de date (Prisma conectează lazy la prima interogare)
    await prisma.$connect();
    console.log('✅ Conectat la PostgreSQL');

    // Seed admin
    const { ensureAdmin } = require('./controllers/authController');
    await ensureAdmin();
    console.log('✅ Admin verificat/creat');

    server.listen(PORT, () => {
      console.log(`🚀 BIOXIC backend pornit pe http://localhost:${PORT}`);
      console.log(`📊 WebSocket chat: ws://localhost:${PORT}/api/ws/chat`);
    });
  } catch (err) {
    console.error('❌ Eroare la pornire:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

module.exports = { app, server };
