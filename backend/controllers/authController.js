const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (row) return res.status(400).json({ message: 'User already exists' });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user
      db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], function(err) {
        if (err) return res.status(500).json({ message: 'Error creating user' });
        
        const payload = { userId: this.lastID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ token, user: { id: this.lastID, name, email } });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const payload = { userId: user.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
