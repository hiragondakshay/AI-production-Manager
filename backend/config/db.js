const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Health profiles table
      db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE,
        age INTEGER,
        height REAL,
        weight REAL,
        gender TEXT,
        bmi REAL,
        bmiCategory TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Health data (vitals, symptoms, lifestyle) table
      db.run(`CREATE TABLE IF NOT EXISTS health_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        systolic INTEGER,
        diastolic INTEGER,
        temperature REAL,
        spo2 INT,
        heartRate INT,
        symptoms TEXT, -- Stored as JSON string
        sleep TEXT,
        diet TEXT,
        stress TEXT,
        habits TEXT,
        exercise TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Reports table
      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        healthDataId INTEGER,
        score INTEGER,
        predictedDiseases TEXT, -- JSON string
        recommendations TEXT, -- JSON string
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (healthDataId) REFERENCES health_data(id) ON DELETE CASCADE
      )`);
    });
  }
});

module.exports = db;
