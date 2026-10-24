const db = require('../config/db');
const { analyzeHealth } = require('../services/predictionEngine');
const { generateRecommendations } = require('../services/recommendationEngine');
const { generatePDF } = require('../services/pdfService');

exports.generateReport = (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM profiles WHERE userId = ?', [userId], (err, profile) => {
    if (err || !profile) return res.status(404).json({ message: 'Profile not found' });

    db.get('SELECT * FROM health_data WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId], (err, healthData) => {
      if (err || !healthData) return res.status(404).json({ message: 'Health data not found' });

      // Run logic engines
      const { score, predictions } = analyzeHealth(profile, healthData);
      const recommendations = generateRecommendations(profile, healthData, predictions);

      const predictedDiseasesJSON = JSON.stringify(predictions);
      const recommendationsJSON = JSON.stringify(recommendations);

      // Save report to database
      db.run('INSERT INTO reports (userId, healthDataId, score, predictedDiseases, recommendations) VALUES (?, ?, ?, ?, ?)',
        [userId, healthData.id, score, predictedDiseasesJSON, recommendationsJSON], function(err) {
          if (err) return res.status(500).json({ message: 'Error saving report' });

          const reportId = this.lastID;
          res.status(200).json({
            id: reportId,
            score,
            predictedDiseases: predictions,
            recommendations
          });
      });
    });
  });
};

exports.getReport = (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM reports WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId], (err, report) => {
    if (err) return res.status(500).json({ message: 'Error fetching report' });
    if (!report) return res.status(404).json({ message: 'No report found' });

    report.predictedDiseases = JSON.parse(report.predictedDiseases || '[]');
    report.recommendations = JSON.parse(report.recommendations || '{}');
    
    res.status(200).json(report);
  });
};

exports.downloadPDF = (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM reports WHERE userId = ? ORDER BY createdAt DESC LIMIT 1', [userId], (err, report) => {
    if (err || !report) return res.status(404).json({ message: 'No report found' });

    db.get('SELECT * FROM profiles WHERE userId = ?', [userId], (err, profile) => {
      if (err || !profile) return res.status(404).json({ message: 'Profile not found' });

      report.predictedDiseases = JSON.parse(report.predictedDiseases || '[]');
      report.recommendations = JSON.parse(report.recommendations || '{}');

      db.get('SELECT name FROM users WHERE id = ?', [userId], (err, user) => {
        profile.name = user ? user.name : 'Patient';
        generatePDF(report, profile, res);
      });
    });
  });
};
