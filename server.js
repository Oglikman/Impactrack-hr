require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const ExcelJS = require('exceljs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { v4: uuidv4 } = require('uuid');

const app = express();
const dbPath = path.join(__dirname, 'hr_attendance.db');

// Open SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database - add users table for OAuth
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'worker',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    google_id TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    check_in_time DATETIME NOT NULL,
    check_out_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_checkins_worker_id ON checkins(worker_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_checkins_check_in_time ON checkins(check_in_time)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_leaves_worker_id ON leaves(worker_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_leaves_start_date ON leaves(start_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id)`);
});

// Middleware setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.CORS_ORIGIN || 'http://localhost:5000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname))); // Serve HTML files
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? true : false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: '/auth/google/callback',
    proxy: true
  },
  (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails && emails[0] ? emails[0].value : '';

    db.get('SELECT * FROM users WHERE google_id = ?', [id], (err, user) => {
      if (err) return done(err);

      if (user) {
        return done(null, user);
      }

      // Create new user
      db.run(
        'INSERT INTO users (google_id, email, name, role) VALUES (?, ?, ?, ?)',
        [id, email, displayName, 'worker'],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed: users.email')) {
              // Email already exists, update google_id
              db.run('UPDATE users SET google_id = ? WHERE email = ?', [id, email], (updateErr) => {
                if (updateErr) return done(updateErr);
                db.get('SELECT * FROM users WHERE google_id = ?', [id], (getErr, updatedUser) => {
                  return done(getErr, updatedUser);
                });
              });
            } else {
              return done(err);
            }
          } else {
            const newUser = { id: this.lastID, google_id: id, email, name: displayName, role: 'worker' };
            return done(null, newUser);
          }
        }
      );
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// ========== AUTHENTICATION MIDDLEWARE ==========
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ========== AUTHENTICATION ROUTES ==========
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login-error.html' }), (req, res) => {
  console.log('✓ OAuth callback successful');
  console.log('User:', req.user);

  if (!req.user) {
    console.error('ERROR: req.user is undefined after OAuth');
    return res.redirect('/worker.html');
  }

  // Save session before redirecting
  req.session.save((err) => {
    if (err) {
      console.error('ERROR saving session:', err);
      return res.redirect('/worker.html');
    }

    // Redirect to appropriate interface based on role
    const redirectUrl = req.user.role === 'admin' ? '/admin.html' : '/worker.html';
    console.log('✓ Session saved. Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  });
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

app.get('/auth/user', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// ========== ADMIN ENDPOINTS ==========
app.get('/api/workers', requireAdmin, (req, res) => {
  db.all('SELECT * FROM workers ORDER BY name', (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows || []);
  });
});

app.post('/api/workers', requireAdmin, (req, res) => {
  const { name, email } = req.body;
  db.run('INSERT INTO workers (name, email) VALUES (?, ?)', [name, email || null], function(err) {
    if (err) res.status(400).json({ error: err.message });
    else res.json({ id: this.lastID, name, email });
  });
});

app.delete('/api/workers/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM workers WHERE id = ?', [req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// ========== USER MANAGEMENT ==========
app.get('/api/users', requireAdmin, (req, res) => {
  db.all('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows || []);
  });
});

app.patch('/api/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'worker'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// ========== CHECK-INS ==========
app.post('/api/checkins', requireAuth, (req, res) => {
  const { worker_id, check_in_time } = req.body;
  db.run('INSERT INTO checkins (worker_id, check_in_time) VALUES (?, ?)', [worker_id, check_in_time], function(err) {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ id: this.lastID, worker_id, check_in_time, check_out_time: null });
  });
});

app.get('/api/checkins/today', requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all(`SELECT c.*, w.name as worker_name FROM checkins c
    JOIN workers w ON c.worker_id = w.id
    WHERE DATE(c.check_in_time) = ? ORDER BY c.check_in_time DESC`, [today], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows || []);
  });
});

app.get('/api/checkins/month/:month', requireAdmin, (req, res) => {
  const month = req.params.month;
  db.all(`SELECT c.*, w.name as worker_name FROM checkins c
    JOIN workers w ON c.worker_id = w.id
    WHERE strftime('%Y-%m', c.check_in_time) = ? ORDER BY c.check_in_time DESC`, [month], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows || []);
  });
});

// Worker's own check-ins
app.get('/api/checkins/worker/:worker_id', (req, res) => {
  const { worker_id } = req.params;

  // Verify worker belongs to authenticated user
  db.get('SELECT user_id FROM workers WHERE id = ?', [worker_id], (err, worker) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!worker || worker.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.all(`SELECT c.* FROM checkins c WHERE c.worker_id = ? ORDER BY c.check_in_time DESC LIMIT 30`, [worker_id], (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows || []);
    });
  });
});

app.patch('/api/checkins/:id', requireAuth, (req, res) => {
  const { check_out_time } = req.body;
  db.run('UPDATE checkins SET check_out_time = ? WHERE id = ?', [check_out_time, req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// ========== LEAVES ==========
app.post('/api/leaves', requireAuth, (req, res) => {
  const { worker_id, start_date, end_date, leave_type, reason } = req.body;

  // Verify worker belongs to authenticated user (if worker version)
  if (req.user.role === 'worker') {
    db.get('SELECT user_id FROM workers WHERE id = ?', [worker_id], (err, worker) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!worker || worker.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      insertLeave();
    });
  } else {
    insertLeave();
  }

  function insertLeave() {
    db.run('INSERT INTO leaves (worker_id, start_date, end_date, leave_type, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [worker_id, start_date, end_date, leave_type, reason || null, 'pending'],
      function(err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id: this.lastID, worker_id, start_date, end_date, leave_type, reason, status: 'pending' });
      });
  }
});

app.get('/api/leaves/:worker_id', requireAuth, (req, res) => {
  // Workers can only see their own leaves
  if (req.user.role === 'worker') {
    db.get('SELECT user_id FROM workers WHERE id = ?', [req.params.worker_id], (err, worker) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!worker || worker.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      getLeaves();
    });
  } else {
    getLeaves();
  }

  function getLeaves() {
    db.all('SELECT * FROM leaves WHERE worker_id = ? ORDER BY start_date DESC', [req.params.worker_id], (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows || []);
    });
  }
});

app.get('/api/leaves', requireAdmin, (req, res) => {
  db.all(`SELECT l.*, w.name as worker_name FROM leaves l
    JOIN workers w ON l.worker_id = w.id ORDER BY l.start_date DESC`, (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows || []);
  });
});

app.patch('/api/leaves/:id/approve', requireAdmin, (req, res) => {
  db.run('UPDATE leaves SET status = ? WHERE id = ?', ['approved', req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

app.patch('/api/leaves/:id/reject', requireAdmin, (req, res) => {
  db.run('UPDATE leaves SET status = ? WHERE id = ?', ['rejected', req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// ========== EXCEL EXPORT ==========
app.get('/api/export/monthly/:month', requireAdmin, (req, res) => {
  const month = req.params.month;

  db.all(`SELECT c.*, w.name as worker_name FROM checkins c
    JOIN workers w ON c.worker_id = w.id
    WHERE strftime('%Y-%m', c.check_in_time) = ? ORDER BY c.check_in_time DESC`, [month], async (err, checkins) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('דוח נוכחות');

    worksheet.columns = [
      { header: 'שם עובד', key: 'worker_name', width: 20 },
      { header: 'תאריך', key: 'date', width: 12 },
      { header: 'שעת כניסה', key: 'check_in_time', width: 12 },
      { header: 'שעת יציאה', key: 'check_out_time', width: 12 },
      { header: 'שעות עבודה', key: 'hours', width: 12 }
    ];

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    checkins.forEach(row => {
      const checkInTime = new Date(row.check_in_time);
      const checkOutTime = row.check_out_time ? new Date(row.check_out_time) : null;
      let hours = '-';

      if (checkOutTime) {
        const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        hours = diff.toFixed(2);
      }

      worksheet.addRow({
        worker_name: row.worker_name,
        date: checkInTime.toLocaleDateString('he-IL'),
        check_in_time: checkInTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        check_out_time: checkOutTime ? checkOutTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '-',
        hours: hours
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="דוח_נוכחות_${month}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  });
});

// ========== SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log(`\nGoogle OAuth Setup:`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set - Get from: https://console.cloud.google.com'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not set'}`);
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('\n⚠️  Worker authentication requires Google OAuth credentials.');
    console.log('Admin interface works without it.\n');
  }
});
