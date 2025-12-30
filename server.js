const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new Database('nurses.db');

// Create nurses table if it doesn't exist
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

// Insert some sample data if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM nurses').get();
if (count.count === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO nurses (name, license_number, dob, age) VALUES (?, ?, ?, ?)
  `);
  
  const sampleNurses = [
    ['Sarah Johnson', 'RN-2024-001', '1985-03-15', 39],
    ['Michael Chen', 'RN-2024-002', '1990-07-22', 34],
    ['Emily Williams', 'RN-2024-003', '1988-11-08', 36],
    ['David Martinez', 'RN-2024-004', '1992-05-30', 32],
    ['Jessica Brown', 'RN-2024-005', '1987-09-12', 37]
  ];
  
  sampleNurses.forEach(nurse => insertStmt.run(...nurse));
  console.log('Sample data inserted successfully');
}

// API Routes

// GET all nurses
app.get('/api/nurses', async (req, res) => {
  try {
    // Using Promise to demonstrate async/await
    const nurses = await new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('SELECT * FROM nurses ORDER BY id DESC');
        const results = stmt.all();
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
    
    res.json({ success: true, data: nurses });
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nurses' });
  }
});

// GET single nurse by ID
app.get('/api/nurses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const nurse = await new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('SELECT * FROM nurses WHERE id = ?');
        const result = stmt.get(id);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    if (!nurse) {
      return res.status(404).json({ success: false, error: 'Nurse not found' });
    }
    
    res.json({ success: true, data: nurse });
  } catch (error) {
    console.error('Error fetching nurse:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nurse' });
  }
});

// POST create new nurse
app.post('/api/nurses', async (req, res) => {
  try {
    const { name, license_number, dob, age } = req.body;
    
    // Validation
    if (!name || !license_number || !dob || !age) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: name, license_number, dob, age' 
      });
    }
    
    const result = await new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO nurses (name, license_number, dob, age) 
          VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(name, license_number, dob, parseInt(age));
        resolve(info);
      } catch (error) {
        reject(error);
      }
    });
    
    // Fetch the created nurse
    const newNurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ 
      success: true, 
      message: 'Nurse created successfully',
      data: newNurse 
    });
  } catch (error) {
    console.error('Error creating nurse:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ 
        success: false, 
        error: 'License number already exists' 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to create nurse' });
  }
});

// PUT update nurse
app.put('/api/nurses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_number, dob, age } = req.body;
    
    // Check if nurse exists
    const existingNurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(id);
    if (!existingNurse) {
      return res.status(404).json({ success: false, error: 'Nurse not found' });
    }
    
    // Validation
    if (!name || !license_number || !dob || !age) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: name, license_number, dob, age' 
      });
    }
    
    await new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          UPDATE nurses 
          SET name = ?, license_number = ?, dob = ?, age = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(name, license_number, dob, parseInt(age), id);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    // Fetch the updated nurse
    const updatedNurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(id);
    
    res.json({ 
      success: true, 
      message: 'Nurse updated successfully',
      data: updatedNurse 
    });
  } catch (error) {
    console.error('Error updating nurse:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ 
        success: false, 
        error: 'License number already exists' 
      });
    }
    res.status(500).json({ success: false, error: 'Failed to update nurse' });
  }
});

// DELETE nurse
app.delete('/api/nurses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if nurse exists
    const existingNurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(id);
    if (!existingNurse) {
      return res.status(404).json({ success: false, error: 'Nurse not found' });
    }
    
    await new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('DELETE FROM nurses WHERE id = ?');
        stmt.run(id);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Nurse deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting nurse:', error);
    res.status(500).json({ success: false, error: 'Failed to delete nurse' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Nurse Management Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

