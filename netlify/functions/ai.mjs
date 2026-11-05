const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const { system, messages, model = 'gemini-2.5-flash' } = await req.json();

  try {
    const r = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY, // key 只放在伺服器
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error(data);
      return json({ error: 'AI 服務暫時無法使用' }, 500);
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
    return json({ text });
  } catch (e) {
    console.error(e);
    return json({ error: 'AI 服務暫時無法使用' }, 500);
  }
};

export const config = { path: '/api/ai' };