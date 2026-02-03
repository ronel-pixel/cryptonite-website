export default async function handler(req, res) {
  // בדיקה שהבקשה היא אכן POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.VITE_AI_MODEL || "gpt-3.5-turbo",
        messages: req.body.messages,
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from OpenAI' });
  }
}