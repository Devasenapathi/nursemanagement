const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'nurses.db'));

// Create nurses table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS nurses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    dob TEXT NOT NULL,
    age INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper function to simulate async operations with promises
const asyncQuery = (queryFn) => {
  return new Promise((resolve, reject) => {
    try {
      const result = queryFn();
      // Simulate async delay for demonstration
      setTimeout(() => resolve(result), 100);
    } catch (error) {
      reject(error);
    }
  });
};

// GET all nurses
app.get('/api/nurses', async (req, res) => {
  try {
    const nurses = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses ORDER BY id DESC');
      return stmt.all();
    });
    res.json(nurses);
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({ error: 'Failed to fetch nurses' });
  }
});

// GET single nurse by ID
app.get('/api/nurses/:id', async (req, res) => {
  try {
    const nurse = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
      return stmt.get(req.params.id);
    });
    
    if (!nurse) {
      return res.status(404).json({ error: 'Nurse not found' });
    }
    res.json(nurse);
  } catch (error) {
    console.error('Error fetching nurse:', error);
    res.status(500).json({ error: 'Failed to fetch nurse' });
  }
});

// POST create new nurse
app.post('/api/nurses', async (req, res) => {
  const { name, license_number, dob, age } = req.body;
  
  if (!name || !license_number || !dob || age === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await asyncQuery(() => {
      const stmt = db.prepare(
        'INSERT INTO nurses (name, license_number, dob, age) VALUES (?, ?, ?, ?)'
      );
      return stmt.run(name, license_number, dob, parseInt(age));
    });

    const newNurse = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
      return stmt.get(result.lastInsertRowid);
    });

    res.status(201).json(newNurse);
  } catch (error) {
    console.error('Error creating nurse:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    res.status(500).json({ error: 'Failed to create nurse' });
  }
});

// PUT update nurse
app.put('/api/nurses/:id', async (req, res) => {
  const { name, license_number, dob, age } = req.body;
  const { id } = req.params;

  if (!name || !license_number || !dob || age === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if nurse exists
    const existingNurse = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
      return stmt.get(id);
    });

    if (!existingNurse) {
      return res.status(404).json({ error: 'Nurse not found' });
    }

    await asyncQuery(() => {
      const stmt = db.prepare(
        'UPDATE nurses SET name = ?, license_number = ?, dob = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );
      return stmt.run(name, license_number, dob, parseInt(age), id);
    });

    const updatedNurse = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
      return stmt.get(id);
    });

    res.json(updatedNurse);
  } catch (error) {
    console.error('Error updating nurse:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    res.status(500).json({ error: 'Failed to update nurse' });
  }
});

// DELETE nurse
app.delete('/api/nurses/:id', async (req, res) => {
  try {
    const existingNurse = await asyncQuery(() => {
      const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
      return stmt.get(req.params.id);
    });

    if (!existingNurse) {
      return res.status(404).json({ error: 'Nurse not found' });
    }

    await asyncQuery(() => {
      const stmt = db.prepare('DELETE FROM nurses WHERE id = ?');
      return stmt.run(req.params.id);
    });

    res.json({ message: 'Nurse deleted successfully' });
  } catch (error) {
    console.error('Error deleting nurse:', error);
    res.status(500).json({ error: 'Failed to delete nurse' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

