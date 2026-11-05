const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, message: 'Method Not Allowed' }, 405);

  if (!process.env.SHEET_URL) {
    return json({ ok: false, message: '後端沒有讀到 SHEET_URL，請檢查 Netlify 的環境變數並重新部署。' }, 500);
  }
  try {
    const body = await req.json();
    const r = await fetch(process.env.SHEET_URL, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ ...body, secret: process.env.SHEET_SECRET }),
    });
    const text = (await r.text()).trim();
    console.log('Apps Script 回應：', r.status, text.slice(0, 100));

    if (text === 'ok') {
      return json({ ok: true });
    }
    if (text === 'forbidden') {
      return json({ ok: false, message: '密碼不符：Netlify 的 SHEET_SECRET 要和 Apps Script 的 SECRET 完全一致。' });
    }
    if (text.startsWith('<')) {
      return json({ ok: false, message: 'Apps Script 回傳網頁而非結果，請確認部署時「誰可以存取」選「所有人」，且已部署新版本。' });
    }
    return json({ ok: false, message: `Apps Script 回應異常：${text.slice(0, 60)}` });
  } catch (e) {
    console.error(e);
    return json({ ok: false, message: '後端連不到 Apps Script，請檢查 SHEET_URL 是否正確。' }, 500);
  }
};

export const config = { path: '/api/log' };