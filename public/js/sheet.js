export async function sendToSheet(stats, { classInput, group, finalHealth, aiFeedback }) {
  const total = Math.max(stats.seconds, 1);
  const pct = (v) => Math.round((v / total) * 100);

  const payload = {
    classInput,
    group,
    seconds: Math.round(stats.seconds),
    avgDb: Math.round(stats.dbSum / total),
    maxDb: Math.round(stats.dbMax),
    finalHealth: Math.round(finalHealth),
    minHealth: Math.round(stats.minHealth),
    redAlerts: stats.redAlerts,
    greenPct: pct(stats.zone.green),
    yellowPct: pct(stats.zone.yellow),
    redPct: pct(stats.zone.red),
    aiFeedback,
  };

  let res;
  try {
    res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return { ok: false, message: '無法連線到伺服器，請確認後端是否有啟動。' };
  }

  if (res.status === 404) {
    return { ok: false, message: '找不到 /api/log（404），請確認 netlify/functions/log.mjs 與 netlify.toml 已部署。' };
  }

  let data = {};
  try { data = await res.json(); } catch (e) { /* 忽略 */ }

  if (!res.ok || !data.ok) {
    return { ok: false, message: data.message || `伺服器回應異常（狀態碼 ${res.status}）。` };
  }
  return { ok: true, message: '資料已成功送出至教師端試算表。' };
}