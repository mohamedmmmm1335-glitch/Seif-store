const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'seif2024';

// ── DATABASE ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ── INIT DB ───────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      price INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      image VARCHAR(10) DEFAULT '👔',
      description TEXT,
      sizes TEXT DEFAULT '["48","50","52","54"]',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer VARCHAR(200) NOT NULL,
      phone VARCHAR(20),
      product VARCHAR(200),
      size VARCHAR(10),
      status VARCHAR(20) DEFAULT 'جاري',
      total INTEGER DEFAULT 0,
      notes TEXT,
      order_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      customer VARCHAR(200) NOT NULL,
      phone VARCHAR(20),
      appt_date DATE,
      appt_time VARCHAR(10),
      type VARCHAR(50) DEFAULT 'قياس',
      notes TEXT,
      status VARCHAR(20) DEFAULT 'مؤكد',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed sample data if empty
  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO products (name, category, price, stock, image, description, sizes) VALUES
      ('بدلة كلاسيك أسود', 'بدل رجالي', 2500, 8, '👔', 'بدلة كلاسيكية فاخرة قماش إيطالي', '["46","48","50","52","54"]'),
      ('بدلة عريس ملكي', 'بدل عريس', 4500, 3, '🤵', 'بدلة عريس بتصميم ملكي مطرز', '["46","48","50","52"]'),
      ('سموكن ذهبي', 'سموكن', 3200, 5, '🎩', 'سموكن فاخر للمناسبات الخاصة', '["48","50","52","54"]'),
      ('بدلة نهارية بيضاء', 'بدل رجالي', 1800, 12, '👗', 'بدلة بيضاء خفيفة للحفلات', '["46","48","50","52","54","56"]');
    `);
    console.log('✅ Sample products inserted');
  }

  console.log('✅ Database initialized');
}

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AUTH ──────────────────────────────────────────────────
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: Buffer.from(ADMIN_PASSWORD).toString('base64') });
  } else {
    res.status(401).json({ success: false, message: 'كلمة السر غلط' });
  }
});

function auth(req, res, next) {
  const token = req.headers['x-token'];
  if (token === Buffer.from(ADMIN_PASSWORD).toString('base64')) return next();
  res.status(401).json({ error: 'غير مصرح' });
}

// ── PRODUCTS API ──────────────────────────────────────────
// Public - for store display
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    rows.forEach(r => { try { r.sizes = JSON.parse(r.sizes); } catch { r.sizes = []; } });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, category, price, stock, image, description, sizes } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO products (name,category,price,stock,image,description,sizes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, category, price||0, stock||0, image||'👔', description||'', JSON.stringify(sizes||[])]
    );
    rows[0].sizes = JSON.parse(rows[0].sizes);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, category, price, stock, image, description, sizes } = req.body;
    const { rows } = await pool.query(
      'UPDATE products SET name=$1,category=$2,price=$3,stock=$4,image=$5,description=$6,sizes=$7 WHERE id=$8 RETURNING *',
      [name, category, price||0, stock||0, image||'👔', description||'', JSON.stringify(sizes||[]), req.params.id]
    );
    rows[0].sizes = JSON.parse(rows[0].sizes);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stock update shortcut
app.patch('/api/products/:id/stock', auth, async (req, res) => {
  try {
    const { delta } = req.body;
    const { rows } = await pool.query(
      'UPDATE products SET stock = GREATEST(0, stock + $1) WHERE id=$2 RETURNING *',
      [delta, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ORDERS API ────────────────────────────────────────────
app.get('/api/orders', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { customer, phone, product, size, status, total, notes, order_date } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO orders (customer,phone,product,size,status,total,notes,order_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [customer, phone||'', product||'', size||'', status||'جاري', total||0, notes||'', order_date||new Date().toISOString().slice(0,10)]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/orders/:id', auth, async (req, res) => {
  try {
    const { customer, phone, product, size, status, total, notes, order_date } = req.body;
    const { rows } = await pool.query(
      'UPDATE orders SET customer=$1,phone=$2,product=$3,size=$4,status=$5,total=$6,notes=$7,order_date=$8 WHERE id=$9 RETURNING *',
      [customer, phone, product, size, status, total||0, notes||'', order_date, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/orders/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── APPOINTMENTS API ──────────────────────────────────────
app.get('/api/appointments', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM appointments ORDER BY appt_date, appt_time');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/appointments', auth, async (req, res) => {
  try {
    const { customer, phone, appt_date, appt_time, type, notes, status } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO appointments (customer,phone,appt_date,appt_time,type,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [customer, phone||'', appt_date, appt_time||'10:00', type||'قياس', notes||'', status||'مؤكد']
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/appointments/:id', auth, async (req, res) => {
  try {
    const { customer, phone, appt_date, appt_time, type, notes, status } = req.body;
    const { rows } = await pool.query(
      'UPDATE appointments SET customer=$1,phone=$2,appt_date=$3,appt_time=$4,type=$5,notes=$6,status=$7 WHERE id=$8 RETURNING *',
      [customer, phone, appt_date, appt_time, type, notes||'', status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/appointments/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SERVE FRONTEND ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});
