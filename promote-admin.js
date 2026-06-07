const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'hr_attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
});

const email = 'glikman08@gmail.com';

db.run(
  'UPDATE users SET role = ? WHERE email = ?',
  ['admin', email],
  function(err) {
    if (err) {
      console.error('Error updating user:', err);
      process.exit(1);
    }
    console.log(`✓ User ${email} promoted to admin`);

    // Show the user
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
      } else if (user) {
        console.log(`\nUser details:`, user);
      }
      db.close();
      process.exit(0);
    });
  }
);
