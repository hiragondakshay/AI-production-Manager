const db = require('../config/db');

// Calculate BMI & Category
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  let category = '';

  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 18.5 && bmi < 24.9) category = 'Normal';
  else if (bmi >= 25 && bmi < 29.9) category = 'Overweight';
  else category = 'Obese';

  return { bmi: parseFloat(bmi.toFixed(2)), category };
};

exports.saveProfile = (req, res) => {
  const userId = req.user.userId;
  const { age, height, weight, gender } = req.body;
  const { bmi, category } = calculateBMI(weight, height);

  db.get('SELECT * FROM profiles WHERE userId = ?', [userId], (err, row) => {
    if (err) {
      console.error("SELECT profiles err:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (row) {
      db.run('UPDATE profiles SET age=?, height=?, weight=?, gender=?, bmi=?, bmiCategory=? WHERE userId=?', 
        [age, height, weight, gender, bmi, category, userId], function(err) {
          if (err) {
            console.error("UPDATE profiles err:", err);
            return res.status(500).json({ message: 'Error updating profile' });
          }
          res.status(200).json({ message: 'Profile updated', bmi, category });
      });
    } else {
      db.run('INSERT INTO profiles (userId, age, height, weight, gender, bmi, bmiCategory) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [userId, age, height, weight, gender, bmi, category], function(err) {
          if (err) {
            console.error("INSERT profiles err:", err);
            return res.status(500).json({ message: 'Error creating profile: ' + err.message });
          }
          res.status(201).json({ message: 'Profile created', bmi, category });
      });
    }
  });
};

// Helper: Ensure a health_data row exists for the current user
const ensureHealthDataExists = (userId, callback) => {
  db.get('SELECT id FROM health_data WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId], (err, row) => {
    if (err) return callback(err, null);
    if (!row) {
      db.run('INSERT INTO health_data (userId) VALUES (?)', [userId], function(err) {
        if (err) return callback(err, null);
        callback(null, this.lastID);
      });
    } else {
      callback(null, row.id);
    }
  });
};

exports.saveVitals = (req, res) => {
  const userId = req.user.userId;
  const { bp, temperature, spo2, heartRate } = req.body; // bp comes as '120/80'
  const [systolic, diastolic] = bp.split('/').map(Number);

  ensureHealthDataExists(userId, (err, healthDataId) => {
    if (err) return res.status(500).json({ message: 'Error fetching health data' });
    
    db.run('UPDATE health_data SET systolic=?, diastolic=?, temperature=?, spo2=?, heartRate=? WHERE id=?',
      [systolic, diastolic, temperature, spo2, heartRate, healthDataId], function(err) {
        if (err) return res.status(500).json({ message: 'Error saving vitals' });
        res.status(200).json({ message: 'Vitals saved' });
    });
  });
};

exports.saveSymptoms = (req, res) => {
  const userId = req.user.userId;
  const { symptoms } = req.body; // array of symptoms

  ensureHealthDataExists(userId, (err, healthDataId) => {
    if (err) return res.status(500).json({ message: 'Error fetching health data' });
    
    db.run('UPDATE health_data SET symptoms=? WHERE id=?',
      [JSON.stringify(symptoms), healthDataId], function(err) {
        if (err) return res.status(500).json({ message: 'Error saving symptoms' });
        res.status(200).json({ message: 'Symptoms saved' });
    });
  });
};

exports.saveReasons = (req, res) => {
  const userId = req.user.userId;
  const { sleep, diet, stress, habits, exercise } = req.body;

  ensureHealthDataExists(userId, (err, healthDataId) => {
    if (err) return res.status(500).json({ message: 'Error fetching health data' });
    
    db.run('UPDATE health_data SET sleep=?, diet=?, stress=?, habits=?, exercise=? WHERE id=?',
      [sleep, diet, stress, habits, exercise, healthDataId], function(err) {
        if (err) return res.status(500).json({ message: 'Error saving lifestyle reasons' });
        res.status(200).json({ message: 'Lifestyle reasons saved' });
    });
  });
};

exports.getUserData = (req, res) => {
  const userId = req.user.userId;
  
  db.get('SELECT * FROM profiles WHERE userId = ?', [userId], (err, profile) => {
    if (err) return res.status(500).json({ message: 'Error fetching profile' });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    
    db.get('SELECT * FROM health_data WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId], (err, healthData) => {
      if (err) return res.status(500).json({ message: 'Error fetching health data' });
      
      if (healthData) {
        healthData.symptoms = healthData.symptoms ? JSON.parse(healthData.symptoms) : [];
      }
      
      db.get('SELECT name, email FROM users WHERE id = ?', [userId], (err, user) => {
        if (user) {
          profile.name = user.name;
          profile.email = user.email;
        }
        res.status(200).json({ profile, healthData });
      });
    });
  });
};

exports.getHistory = (req, res) => {
  const userId = req.user.userId;
  db.all('SELECT * FROM health_data WHERE userId = ? ORDER BY createdAt ASC', [userId], (err, history) => {
    if (err) return res.status(500).json({ message: 'Error fetching health history' });
    res.status(200).json(history);
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.user.userId;
  const { name, age, height, weight, gender } = req.body;
  const { bmi, category } = calculateBMI(weight, height);

  db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error updating user name' });
    
    db.run('UPDATE profiles SET age=?, height=?, weight=?, gender=?, bmi=?, bmiCategory=? WHERE userId=?', 
      [age, height, weight, gender, bmi, category, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Error updating profile' });
        res.status(200).json({ message: 'Profile full updated', bmi, category, name });
    });
  });
};
