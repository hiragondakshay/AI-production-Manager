exports.chat = (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ reply: "Please say something!" });
  }

  const msg = message.toLowerCase();
  let reply = "I'm a simulated health assistant. I can help answer basic questions about symptoms, diet, and exercise. (Note: I am not a real doctor).";

  if (msg.includes('hello') || msg.includes('hi ')) {
    reply = "Hello! How can I assist you with your health today?";
  } else if (msg.includes('fever') || msg.includes('temperature')) {
    reply = "If you have a fever, it's important to rest and stay hydrated. If it exceeds 39°C (102.2°F) or lasts more than 3 days, please consult a doctor.";
  } else if (msg.includes('headache')) {
    reply = "For a headache, try drinking water, resting in a quiet dark room, and reducing screen time. Persistent or unusually severe headaches warrant medical attention.";
  } else if (msg.includes('blood pressure') || msg.includes('hypertension')) {
    reply = "To manage blood pressure, reduce your sodium intake, exercise regularly, manage stress, and avoid smoking.";
  } else if (msg.includes('diet') || msg.includes('nutrition') || msg.includes('eat')) {
    reply = "A balanced diet relies heavily on whole foods: vegetables, fruits, lean proteins, and whole grains. Minimize processed foods and added sugars.";
  } else if (msg.includes('sleep') || msg.includes('tired') || msg.includes('insomnia')) {
    reply = "For better sleep, try to maintain a consistent sleep schedule, avoid caffeine late in the day, and limit screen time for an hour before bed.";
  } else if (msg.includes('heart') || msg.includes('chest pain')) {
    reply = "⚠️ Chest pain can be a medical emergency. If you are experiencing sudden, severe chest pain, especially with shortness of breath or arm pain, seek emergency medical help immediately.";
  }

  res.status(200).json({ reply });
};
