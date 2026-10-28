
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'menu-service', port: 3002 })
);

// MySQL connection
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'db',
  user:     process.env.DB_USER     || 'cloudeats_user',
  password: process.env.DB_PASSWORD || 'cloudeats_password',
  database: process.env.DB_NAME     || 'cloudeats_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// GET all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menu_items ORDER BY category, name'
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error('Menu fetch error:', err.message);

    res.status(500).json({
      success: false,
      error: 'Could not load menu'
    });
  }
});

// GET menu items by category
app.get('/api/menu/category/:category', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menu_items WHERE category = ? ORDER BY name',
      [req.params.category]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET one menu item by ID
app.get('/api/menu/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menu_items WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ─── RATING VALIDATION ───
function validateRating(rating) {
  if (rating === undefined || rating === null) {
    return { valid: false, error: 'Rating is required' };
  }

  if (typeof rating !== 'number') {
    return { valid: false, error: 'Rating must be a number' };
  }

  if (!Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be a whole number' };
  }

  if (rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }

  return { valid: true };
}

const PORT = process.env.PORT || 3002;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () =>
    console.log(`[menu-service] Running on http://localhost:${PORT}`)
  );
}
if (process.env.NODE_ENV === 'test') {
  module.exports = { validateRating };
}