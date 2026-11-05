import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'https://115-1group4.netlify.app/' }));
app.use(express.json());
app.use(express.static('public'));

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

app.post('/api/ai', async (req, res) => {
  const { system, messages, model = 'gemini-2.5-flash' } = req.body;

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
      return res.status(500).json({ error: 'AI 服務暫時無法使用' });
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
    res.json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI 服務暫時無法使用' });
  }
});   // ← /api/ai 在這裡就結束

app.post('/api/log', async (req, res) => {
  if (!process.env.SHEET_URL) {
    return res.status(500).json({ ok: false, message: '後端沒有讀到 SHEET_URL，請檢查 .env 並重啟。' });
  }
  try {
    const r = await fetch(process.env.SHEET_URL, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ ...req.body, secret: process.env.SHEET_SECRET }),
    });
    const text = (await r.text()).trim();
    console.log('Apps Script 回應：', r.status, text.slice(0, 100));

    if (text === 'ok') {
      return res.json({ ok: true });
    }
    if (text === 'forbidden') {
      return res.json({ ok: false, message: '密碼不符：.env 的 SHEET_SECRET 要和 Apps Script 的 SECRET 完全一致。' });
    }
    if (text.startsWith('<')) {
      return res.json({ ok: false, message: 'Apps Script 回傳網頁而非結果，請確認部署時「誰可以存取」選「所有人」，且已部署新版本。' });
    }
    return res.json({ ok: false, message: `Apps Script 回應異常：${text.slice(0, 60)}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: '後端連不到 Apps Script，請檢查 SHEET_URL 是否正確。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
