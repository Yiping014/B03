import { dom } from './dom.js';
import { state } from './state.js';
import { formatTime, formatDb } from './utils.js';
import { HEALTH_YELLOW } from './config.js';

function renderChart(history) {
  if (history.length < 2) {
    dom.reportChart.innerHTML = '<p>資料不足，無法繪製變化圖。</p>';
    return;
  }
  const n = history.length;
  const points = history
    .map((v, i) => `${(i / (n - 1)) * 300},${80 - (v / 100) * 80}`)
    .join(' ');
  dom.reportChart.innerHTML = `
    <svg viewBox="0 0 300 80" preserveAspectRatio="none">
      <line x1="0" x2="300" y1="16" y2="16" stroke="#f5c84c" stroke-dasharray="4" vector-effect="non-scaling-stroke"/>
      <line x1="0" x2="300" y1="48" y2="48" stroke="#e14b4b" stroke-dasharray="4" vector-effect="non-scaling-stroke"/>
      <polyline points="${points}" fill="none" stroke="#1db77b" stroke-width="2" vector-effect="non-scaling-stroke"/>
    </svg>`;
}

export function renderReport(durationMs, finalHealth) {
  const stats = state.stats;
  const total = Math.max(stats.seconds, 1);
  const pct = (v) => Math.round((v / total) * 100);
  const greenPct = pct(stats.zone.green);
  const yellowPct = pct(stats.zone.yellow);
  const redPct = pct(stats.zone.red);
  const avgDb = stats.dbSum / total;

  dom.reportGroup.textContent =
    `${state.selectedGroup} 組${state.studentClass ? `（${state.studentClass}）` : ''}`;
  dom.reportDuration.textContent = formatTime(durationMs);
  dom.reportAvgDb.textContent = formatDb(avgDb);
  dom.reportMaxDb.textContent = formatDb(stats.dbMax);
  dom.reportFinalHealth.textContent = Math.round(finalHealth);
  dom.reportMinHealth.textContent = Math.round(stats.minHealth);
  dom.reportAlerts.textContent = stats.redAlerts;

  dom.zoneGreen.textContent = `${greenPct}%`;
  dom.zoneYellow.textContent = `${yellowPct}%`;
  dom.zoneRed.textContent = `${redPct}%`;
  dom.zoneGreenBar.style.width = `${greenPct}%`;
  dom.zoneYellowBar.style.width = `${yellowPct}%`;
  dom.zoneRedBar.style.width = `${redPct}%`;

  renderChart(stats.history);

  // AI 整體回饋
  const advice = [];
  let text;
  let boxClass;

  if (stats.seconds < 5) {
    text = '討論時間太短，再試一次。';
    boxClass = 'feedback-box neutral';
  } else if (redPct >= 20 || stats.redAlerts >= 2) {
    text = '小聲一點，保護耳朵！';
    boxClass = 'feedback-box danger';
    advice.push('下次討論前先約定「一次一人發言」的規則。');
    advice.push('音量升高時，可先暫停 10 秒整理重點再繼續。');
  } else if (greenPct >= 70 && stats.redAlerts === 0) {
    text = '聲音剛剛好，好棒！';
    boxClass = 'feedback-box success';
    advice.push('維持目前輪流發言的好習慣。');
  } else {
    text = '加點油，大聲一點點！';
    boxClass = 'feedback-box warning';
    advice.push('看到黃色提醒時，就先放慢語速、降低音量。');
  }

  if (stats.seconds >= 5 && yellowPct >= 30) {
    advice.push(`有 ${yellowPct}% 的時間停留在黃色區間，建議提早調整。`);
  }
  if (stats.seconds >= 5 && finalHealth >= HEALTH_YELLOW) {
    advice.push('結束時健康值已回到綠色，表示團隊有成功自我調整。');
  }

  dom.reportFeedback.textContent = text;
  dom.reportFeedback.className = boxClass;
  dom.reportAdvice.innerHTML = advice.map((item) => `<li>${item}</li>`).join('');
}