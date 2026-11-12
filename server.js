import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const web = path.join(__dirname, 'public');
const srcAssets = path.join(__dirname, 'src', 'assets');
// Vercel's deployed bundle is read-only. Use /tmp for legacy file-backed
// endpoints there; local development continues to use project folders.
const isVercel = Boolean(process.env.VERCEL);
const runtimeDir = isVercel ? path.join('/tmp', 'baekhawhom') : __dirname;
const uploadsDir = isVercel
  ? path.join(runtimeDir, 'uploads')
  : path.join(web, 'uploads');
const dataDir = isVercel ? runtimeDir : path.join(__dirname, 'data');
const settingsFile = path.join(dataDir, 'site-settings.json');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const DEFAULT_SETTINGS = {
  shop_name: 'Baekhawhom',
  shop_subtitle: 'ROV ✦ ID RENTAL & ACCOUNT SHOP',
  shop_quote: '“บริการดี ซื่อสัตย์ ปลอดภัย ยินดีให้บริการค่ะ ♡”',
  shop_status: 'เปิดให้บริการ',
  hero_girl_url: '/assets/images/theme/hero_girl.jpg',
  hero_bunny_url: '/assets/images/theme/hero_bunny.jpg',
  hero_bg_url: '/assets/aistudio/IMG_0003_034758dd.jpeg',
  card_1_url: '/assets/images/theme/card_portrait_1.jpg',
  card_2_url: '/assets/images/theme/card_portrait_2.jpg',
  card_3_url: '/assets/images/theme/card_portrait_3.jpg',
  line_url: 'https://line.me/',
  line_text: '@baekhawhom',
  instagram_url: 'https://www.instagram.com/',
  instagram_text: 'baekhawhom',
  facebook_url: 'https://www.facebook.com/',
  facebook_text: 'baekhawhom',
  featured_accounts: []
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const parsed = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        featured_accounts: Array.isArray(parsed.featured_accounts)
          ? parsed.featured_accounts
          : DEFAULT_SETTINGS.featured_accounts
      };
    }
  } catch (err) {
    console.warn('Failed to read site-settings.json:', err);
  }
  return structuredClone(DEFAULT_SETTINGS);
}

function saveSettings(data) {
  const merged = {
    ...loadSettings(),
    ...data,
    updated_at: new Date().toISOString()
  };
  fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

function saveDataUrlToFile(dataUrl, prefix = 'img') {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return dataUrl;
  let ext = match[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!['jpg', 'png', 'webp', 'gif'].includes(ext)) ext = 'jpg';
  const buffer = Buffer.from(match[2], 'base64');
  const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

app.use(express.json({ limit: '15mb' }));
app.use('/src/assets', express.static(srcAssets));

app.get('/api/site-settings', (_req, res) => {
  res.json(loadSettings());
});

app.post('/api/site-settings', (req, res) => {
  try {
    const body = req.body || {};
    const imageKeys = [
      'hero_girl_url',
      'hero_bunny_url',
      'hero_bg_url',
      'card_1_url',
      'card_2_url',
      'card_3_url'
    ];
    for (const key of imageKeys) {
      if (typeof body[key] === 'string' && body[key].startsWith('data:image/')) {
        body[key] = saveDataUrlToFile(body[key], key);
      }
    }
    const updated = saveSettings(body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post('/api/site-settings/reset', (_req, res) => {
  fs.writeFileSync(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  res.json(loadSettings());
});

app.post('/api/upload-image', (req, res) => {
  try {
    const { dataUrl, prefix } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing image dataUrl' });
    }
    const url = saveDataUrlToFile(dataUrl, prefix || 'upload');
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/api/accounts', (_req, res) => {
  const settings = loadSettings();
  res.json(settings.featured_accounts || []);
});

app.post('/api/accounts', (req, res) => {
  try {
    const settings = loadSettings();
    const list = Array.isArray(settings.featured_accounts) ? settings.featured_accounts : [];
    const body = req.body || {};
    const imageUrl = body.image_url ? saveDataUrlToFile(body.image_url, 'account') : '';
    const nextId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    const newItem = {
      id: nextId,
      title: String(body.title || 'ไอดีใหม่').trim(),
      category: body.category === 'chicken_skin' ? 'chicken_skin' : 'normal',
      status: body.status === 'sold' ? 'sold' : 'available',
      price: Number(body.price || 0),
      description: String(body.description || '').trim(),
      image_url: imageUrl || settings.card_1_url,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    saveSettings({ featured_accounts: list });
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.put('/api/accounts/:id', (req, res) => {
  try {
    const targetId = String(req.params.id);
    const settings = loadSettings();
    const list = Array.isArray(settings.featured_accounts) ? settings.featured_accounts : [];
    const idx = list.findIndex((item) => String(item.id) === targetId);
    const body = req.body || {};
    const imageUrl = body.image_url ? saveDataUrlToFile(body.image_url, 'account') : '';
    if (idx === -1) {
      const created = {
        id: Number(targetId) || Date.now(),
        title: String(body.title || 'ไอดี').trim(),
        category: body.category === 'chicken_skin' ? 'chicken_skin' : 'normal',
        status: body.status === 'sold' ? 'sold' : 'available',
        price: Number(body.price || 0),
        description: String(body.description || '').trim(),
        image_url: imageUrl || settings.card_1_url,
        created_at: new Date().toISOString()
      };
      list.unshift(created);
      saveSettings({ featured_accounts: list });
      return res.json(created);
    }
    list[idx] = {
      ...list[idx],
      title: body.title !== undefined ? String(body.title).trim() : list[idx].title,
      category: body.category || list[idx].category,
      status: body.status || list[idx].status,
      price: body.price !== undefined ? Number(body.price) : list[idx].price,
      description: body.description !== undefined ? String(body.description).trim() : list[idx].description,
      image_url: imageUrl || list[idx].image_url,
      updated_at: new Date().toISOString()
    };
    saveSettings({ featured_accounts: list });
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  const targetId = String(req.params.id);
  const settings = loadSettings();
  const list = (settings.featured_accounts || []).filter(
    (item) => String(item.id) !== targetId
  );
  saveSettings({ featured_accounts: list });
  res.json({ ok: true });
});

app.get('/accounts', (_req, res) => res.sendFile(path.join(web, 'accounts.html')));
app.get('/admin/accounts', (_req, res) => res.sendFile(path.join(web, 'admin', 'accounts.html')));
app.use(express.static(web));

app.use((err, _req, res, _next) => {
  console.error('Unhandled Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export the Express app for Vercel Functions. Start a listener only locally.
if (!process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => console.log('Web running on port ' + port));
}

export default app;
