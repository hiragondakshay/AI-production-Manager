exports.analyzeHealth = (profile, healthData) => {
  const predictions = [];
  let score = 100;
  let deductions = 0;

  const { bmi, bmiCategory } = profile;
  const { systolic, diastolic, temperature, spo2, heartRate, symptoms, sleep, diet, stress, habits, exercise } = healthData;
  const parsedSymptoms = symptoms ? JSON.parse(symptoms) : [];

  const addPrediction = (disease, riskLevel) => {
    predictions.push({ disease, riskLevel });
  };

  // 1. Vitals Analysis
  let hasHighBP = false;
  if (systolic >= 130 || diastolic >= 85) {
    hasHighBP = true;
    deductions += 10;
  }
  
  if (temperature > 37.5) deductions += 5; // Slight fever
  if (temperature > 38.5) deductions += 10; // High fever

  if (spo2 < 95) deductions += 15;
  if (heartRate > 100 || heartRate < 50) deductions += 10;

  // 2. BMI Analysis
  if (bmiCategory === 'Obese') deductions += 15;
  else if (bmiCategory === 'Overweight' || bmiCategory === 'Underweight') deductions += 5;

  // 3. Symptoms & Lifestyle Rules
  const hasSymptom = (sym) => parsedSymptoms.includes(sym);
  
  // Rule: Flu / Viral Infection
  if (hasSymptom('Fever') && (hasSymptom('Cough') || hasSymptom('Fatigue'))) {
    addPrediction('Viral Infection / Flu', 'High');
    deductions += 15;
  } else if (hasSymptom('Fever') || hasSymptom('Cough')) {
    addPrediction('Common Cold', 'Moderate');
  }

  // Rule: Heart Risk
  let heartRisk = 0;
  if (hasSymptom('Chest Pain')) heartRisk += 3;
  if (hasSymptom('Shortness of Breath')) heartRisk += 2;
  if (hasHighBP) heartRisk += 2;
  if (habits && habits.includes('smoking')) heartRisk += 2;
  if (bmiCategory === 'Obese') heartRisk += 1;
  if (stress === 'High') heartRisk += 1;

  if (heartRisk >= 5) {
    addPrediction('Cardiovascular Disease', 'High');
    deductions += 25;
  } else if (heartRisk >= 3) {
    addPrediction('Cardiovascular Disease', 'Moderate');
    deductions += 10;
  }

  // Rule: Diabetes Risk
  let diabetesRisk = 0;
  if (hasSymptom('Frequent Urination')) diabetesRisk += 2;
  if (hasSymptom('Excessive Thirst')) diabetesRisk += 2;
  if (bmiCategory === 'Obese') diabetesRisk += 2;
  if (diet === 'High Sugar') diabetesRisk += 2;
  if (exercise === 'None') diabetesRisk += 1;

  if (diabetesRisk >= 5) {
    addPrediction('Type 2 Diabetes', 'High');
    deductions += 20;
  } else if (diabetesRisk >= 3) {
    addPrediction('Type 2 Diabetes', 'Moderate');
    deductions += 10;
  }

  // General Wellness Deductions based on lifestyle
  if (sleep === 'Poor') deductions += 5;
  if (stress === 'High') deductions += 5;
  if (exercise === 'None') deductions += 5;

  score = Math.max(0, score - deductions);

  return {
    score,
    predictions
  };
};
