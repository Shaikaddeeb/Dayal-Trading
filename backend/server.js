require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path     = require('path');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

const watchSchema = new mongoose.Schema({
    brand:         { type: String, required: true },
    name:          { type: String, required: true },
    price:         { type: String, required: true },
    type:          { type: String, required: true },
    desc:          { type: String, default: '' },
    img:           { type: String, required: true },
    images:        [{ url: String, publicId: String }],
    imagePublicId: { type: String },
    category:      { type: String, enum: ['men', 'women'], required: true }
}, { timestamps: true });

const Watch = mongoose.model('Watch', watchSchema);

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// JSON + urlencoded only for non-multipart routes
app.use((req, res, next) => {
    if (req.is('multipart/form-data')) return next();
    express.json({ limit: '1mb' })(req, res, next);
});
app.use((req, res, next) => {
    if (req.is('multipart/form-data')) return next();
    express.urlencoded({ extended: true, limit: '1mb' })(req, res, next);
});

// ── CSRF protection ───────────────────────────────────────────────────────────
const CSRF_HEADER = 'x-csrf-token';
const csrfTokens = new Set();

app.get('/api/csrf-token', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    csrfTokens.add(token);
    setTimeout(() => csrfTokens.delete(token), 3600000); // expire in 1h
    res.json({ csrfToken: token });
});

function csrfProtect(req, res, next) {
    const token = req.headers[CSRF_HEADER];
    if (!token || !csrfTokens.has(token)) {
        return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
    }
    next();
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
}

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }   // 20 MB
});

// ── Cloudinary helper ─────────────────────────────────────────────────────────
function toCloudinary(buffer, folder = 'dayal-watches') {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (err, result) => err ? reject(err) : resolve(result)
        ).end(buffer);
    });
}

// ── API routes ────────────────────────────────────────────────────────────────

// Accessory Schema
const accSchema = new mongoose.Schema({
    name: String, type: String, price: String,
    desc: String, img: String, images: [String]
}, { timestamps: true });
const Accessory = mongoose.model('Accessory', accSchema);

// GET all accessories
app.get('/api/accessories', async (req, res) => {
    try { res.json(await Accessory.find().sort({ createdAt: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add accessory
app.post('/api/accessories', requireAuth, csrfProtect, async (req, res) => {
    try {
        const { name, type, price, desc, img, images } = req.body;
        const a = await Accessory.create({ name, type, price, desc, img, images });
        res.json({ success: true, accessory: a });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT edit accessory
app.put('/api/accessories/:id', requireAuth, csrfProtect, async (req, res) => {
    try {
        const { name, type, price, desc, img, images } = req.body;
        const a = await Accessory.findByIdAndUpdate(req.params.id, { name, type, price, desc, img, images }, { new: true });
        res.json({ success: true, accessory: a });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE accessory
app.delete('/api/accessories/:id', requireAuth, csrfProtect, async (req, res) => {
    try {
        await Accessory.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET watches by category
app.get('/api/watches/:category', async (req, res) => {
    const allowed = ['men', 'women'];
    if (!allowed.includes(req.params.category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    try {
        const watches = await Watch.find({ category: req.params.category })
                                   .sort({ createdAt: -1 });
        res.json(watches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add watch
app.post('/api/add-watch', requireAuth, csrfProtect, upload.array('images', 10), async (req, res) => {
    try {
        let { category, watch } = req.body;
        if (typeof watch === 'string') {
            try { watch = JSON.parse(watch); }
            catch { return res.status(400).json({ success: false, error: 'Invalid watch data' }); }
        }

        let mainImg      = watch.img || '';
        let mainPublicId = null;
        let allImages    = [];

        if (req.files && req.files.length > 0) {
            const uploads = await Promise.all(req.files.map(f => toCloudinary(f.buffer)));
            allImages    = uploads.map(r => ({ url: r.secure_url, publicId: r.public_id }));
            mainImg      = allImages[0].url;
            mainPublicId = allImages[0].publicId;
        } else if (mainImg && mainImg.startsWith('data:')) {
            const r  = await cloudinary.uploader.upload(mainImg, { folder: 'dayal-watches', resource_type: 'auto' });
            mainImg      = r.secure_url;
            mainPublicId = r.public_id;
            allImages    = [{ url: mainImg, publicId: mainPublicId }];
        } else if (mainImg) {
            allImages = [{ url: mainImg, publicId: null }];
        }

        const newWatch = await Watch.create({
            brand: watch.brand, name: watch.name, price: watch.price,
            type: watch.type,   desc: watch.desc || '',
            img: mainImg,       imagePublicId: mainPublicId,
            images: allImages,  category
        });

        res.json({ success: true, watch: newWatch });
    } catch (err) {
        console.error('Add watch error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT edit watch
app.put('/api/watches/:id', requireAuth, csrfProtect, upload.array('images', 10), async (req, res) => {
    try {
        const existing = await Watch.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Watch not found' });

        // FormData sends watch as JSON string; plain JSON sends object directly
        let body;
        if (req.body && req.body.watch) {
            try { body = JSON.parse(req.body.watch); }
            catch { return res.status(400).json({ success: false, error: 'Invalid watch data' }); }
            body.category = req.body.category || existing.category;
        } else {
            body = req.body || {};
        }

        let mainImg      = body.img || existing.img;
        let mainPublicId = existing.imagePublicId;
        let allImages    = existing.images || [];

        if (req.files && req.files.length > 0) {
            // delete old images from Cloudinary
            for (const img of existing.images || []) {
                if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
            }
            const uploads = await Promise.all(req.files.map(f => toCloudinary(f.buffer)));
            allImages    = uploads.map(r => ({ url: r.secure_url, publicId: r.public_id }));
            mainImg      = allImages[0].url;
            mainPublicId = allImages[0].publicId;
        }

        const updated = await Watch.findByIdAndUpdate(req.params.id, {
            brand:    body.brand    || existing.brand,
            name:     body.name     || existing.name,
            price:    body.price    || existing.price,
            type:     body.type     || existing.type,
            desc:     body.desc     !== undefined ? body.desc : existing.desc,
            category: body.category || existing.category,
            img: mainImg, imagePublicId: mainPublicId, images: allImages
        }, { new: true });

        res.json({ success: true, watch: updated });
    } catch (err) {
        console.error('Edit error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE watch
app.delete('/api/watches/:id', requireAuth, csrfProtect, async (req, res) => {
    try {
        const watch = await Watch.findById(req.params.id);
        if (!watch) return res.status(404).json({ success: false, message: 'Watch not found' });
        for (const img of watch.images || []) {
            if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
        }
        await Watch.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// CSRF token (simple implementation)
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: 'dayal-csrf-' + Date.now() });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    try {
        const userMatch = crypto.timingSafeEqual(
            Buffer.from(username), Buffer.from(process.env.ADMIN_USERNAME || '')
        );
        const passMatch = crypto.timingSafeEqual(
            Buffer.from(password), Buffer.from(process.env.ADMIN_PASSWORD || '')
        );
        if (userMatch && passMatch) {
            const token = process.env.ADMIN_TOKEN || crypto.randomBytes(32).toString('hex');
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// ── Static frontend (AFTER all API routes) ────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all — only for GET requests (never intercept API calls)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
