import './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import trendRoutes from './routes/trends.js';
import dashboardRoutes from './routes/dashboard.js';
import trendingContentRoutes from './routes/trendingContent.js';
import saturationRoutes from './routes/saturation.js';
import aiRoutes from './routes/ai.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Trust proxy for Railway deployment (required for rate limiting)
app.set('trust proxy', true);

const isProd = process.env.NODE_ENV === 'production';
const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, '');
const r2Sources = r2PublicUrl ? [r2PublicUrl] : [];

app.use(helmet({
  contentSecurityPolicy: isProd ? {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co', ...r2Sources],
      mediaSrc: ["'self'", 'blob:', ...r2Sources],
      connectSrc: [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://*.openai.azure.com',
        'https://api.fonnte.com',
        ...r2Sources,
      ],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust Railway proxy headers
});

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trending-content', trendingContentRoutes);
app.use('/api/saturation', saturationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Static file serving removed - frontend is deployed separately on Vercel
// app.use(express.static(distPath));
// app.get('*', (_req, res) => {
//   res.sendFile(path.join(distPath, 'index.html'));
// });

app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});
