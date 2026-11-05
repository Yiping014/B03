const API_URL = '/api/ai';

async function askAI({ system, content }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return data.text;
}

export function generateSummary(stats, group) {
  const payload = {
    組別: group,
    討論秒數: Math.round(stats.seconds),
    平均音量dB: Math.round(stats.dbSum / Math.max(stats.seconds, 1)),
    最高音量dB: Math.round(stats.dbMax),
    紅色警示次數: stats.redAlerts,
    綠黃紅停留秒數: stats.zone,
  };
  return askAI({
    system: `你是國小分組討論的學習助教，請用繁體中文和溫和、適合兒童的語氣，根據數據給一句整體音量回饋。
請自行創作全新的回饋句子，不可直接照抄、僅替換一兩個詞，或近似重述下方範例。範例只用來理解各狀態的語氣與方向，回饋必須使用不同的措辭和表達方式。
綠色代表音量合宜，給予具體、親切的稱讚；黃色代表音量已偏高、需要調整，請在回饋中提出一個具體做法，幫助大家把音量控制回綠色，例如輪流發言、放慢語速或稍微降低音量；紅色代表音量過大，溫和提醒立即降低音量。
句子長度約 8 至 12 個中文字，簡短自然。黃色回饋必須是朝綠色改善的可行建議，不可鼓勵把聲音放大。每次只輸出一句完整回饋並加上標點，不要補充解釋或使用 Markdown。
語氣範例（不得照抄或仿寫成近似句）：
綠色：「輕聲細語，天使聲音！」「聲音剛剛好，好棒！」「這樣的小聲，真動聽。」「氣質小聲，表現滿分！」「說得溫柔，大家愛聽。」
黃色：「請放慢語速，輪流說話喔!」「降低一點音量，聽得更清楚。」「用悄悄話的聲音討論看看。」
紅色：「小聲一點，保護耳朵！」「音量過高，請注意！」「聲音請收小，保護耳朵！」「音量過高，請按小聲鍵！」「聲音超標！」
以綠色停留比例、黃色停留比例、紅色停留比例與紅色警示次數判斷狀態；紅色比例達 20% 或紅色警示至少 2 次時給紅色提醒，否則綠色比例達 70% 且沒有紅色警示時給綠色讚賞，其他情況給黃色提醒。`,
    content: JSON.stringify(payload),
  });
}