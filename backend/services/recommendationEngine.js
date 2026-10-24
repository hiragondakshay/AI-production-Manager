exports.generateRecommendations = (profile, healthData, predictions) => {
  const recommendations = {
    nutrition: [],
    exercise: [],
    prevention: [],
    advice: []
  };

  const { bmiCategory } = profile;
  const { diastolic, systolic, diet, exercise, stress, sleep } = healthData;

  // Baseline Advice
  recommendations.advice.push("This is not a medical diagnosis. Consult a doctor before taking any medicine.");

  // Nutrition
  if (bmiCategory === 'Obese' || bmiCategory === 'Overweight') {
    recommendations.nutrition.push("Focus on a calorie-deficit diet rich in whole foods, vegetables, and lean protein.");
  } else if (bmiCategory === 'Underweight') {
    recommendations.nutrition.push("Increase caloric intake with nutrient-dense foods like nuts, avocados, and healthy carbs.");
  }

  if (systolic >= 130 || diastolic >= 85) {
    recommendations.nutrition.push("Adopt a low-sodium (DASH) diet to help manage blood pressure.");
  }

  if (diet === 'High Sugar') {
    recommendations.nutrition.push("Reduce refined sugar intake to prevent insulin spikes and lower diabetes risk.");
  }

  if (recommendations.nutrition.length === 0) {
    recommendations.nutrition.push("Maintain a balanced diet rich in micronutrients and stay hydrated.");
  }

  // Exercise
  if (exercise === 'None' || exercise === 'Rarely') {
    recommendations.exercise.push("Start with 15-20 minutes of daily light walking or stretching to build a habit.");
  } else if (bmiCategory === 'Obese') {
    recommendations.exercise.push("Incorporate low-impact cardio like swimming or cycling for at least 150 minutes a week.");
  } else {
    recommendations.exercise.push("Maintain your exercise routine. Consider incorporating both resistance training and cardiovascular work.");
  }

  // Prevention & Medical Advice
  let recommendedVaccines = [];
  predictions.forEach(p => {
    if (p.disease.includes('Flu')) recommendedVaccines.push("Annual Flu Vaccine");
    if (p.disease.includes('Cardiovascular')) {
      recommendations.prevention.push("Schedule a comprehensive lipid panel and ECG with your cardiologist.");
    }
    if (p.disease.includes('Diabetes')) {
      recommendations.prevention.push("Check your fasting blood glucose and HbA1c levels.");
    }
  });

  if (recommendedVaccines.length > 0) {
    recommendations.prevention.push(`Consider getting: ${recommendedVaccines.join(', ')}`);
  }

  if (sleep === 'Poor') {
    recommendations.advice.push("Establish a consistent sleep schedule and reduce screen time before bed to improve sleep hygiene.");
  }
  if (stress === 'High') {
    recommendations.advice.push("Consider mindfulness practices, meditation, or speaking to a therapist to manage stress levels.");
  }

  return recommendations;
};
