import { dom } from './dom.js';
import { HEALTH_RED, HEALTH_YELLOW } from './config.js';

function getStatusMeta(volumeDifferenceDb) {
  if (volumeDifferenceDb <= 2) {
    return { label: '正常', className: 'status ok', boxClass: 'feedback-box success' };
  }
  if (volumeDifferenceDb <= 10) {
    return { label: '偏高', className: 'status warning', boxClass: 'feedback-box warning' };
  }
  return { label: '過吵', className: 'status danger', boxClass: 'feedback-box danger' };
}

function getFeedbackText(dbValue, environmentDb) {
  const diff = Math.round(dbValue - environmentDb);
  const head = `目前音量 ${Math.round(dbValue)} dB（比環境高 ${Math.max(diff, 0)} dB）。`;

  if (diff <= 2) {
    return `${head}討論音量適中，繼續保持節奏與輪流發言。`;
  }
  if (diff <= 6) {
    return `${head}聲量稍高，請適度放慢語速，讓同伴有發言空間。`;
  }
  if (diff <= 10) {
    return `${head}聲量偏高，請降低音量，並確認每位成員都有機會表達。`;
  }
  if (diff <= 20) {
    return `${head}聲量過高，請先整理重點，避免多人同時發言。`;
  }
  return `${head}音量非常大！請立刻暫停，一次只讓一個人說話。`;
}

export function setStatus(volumeDifferenceDb, dbValue, environmentDb) {
  const meta = getStatusMeta(volumeDifferenceDb);
  dom.statusText.textContent = meta.label;
  dom.statusText.className = meta.className;
  dom.feedbackBox.textContent = getFeedbackText(dbValue, environmentDb);
  dom.feedbackBox.className = meta.boxClass;
  return meta;
}

export function setRecoveryFeedback(health) {
  dom.feedbackBox.textContent = `健康值提升至 ${Math.round(health)} 分，繼續保持！`;
}

export function updateHealthReminder(health) {
  if (health < HEALTH_YELLOW && health >= HEALTH_RED) {
    dom.healthReminder.textContent = `⚠ 討論健康值已降到 ${Math.round(health)}（黃色區間），再不調整就會進入紅色警示，請放慢語速、降低音量。`;
    dom.healthReminder.hidden = false;
  } else {
    dom.healthReminder.hidden = true;
  }
}

export function updateSignalBars(level) {
  dom.signalBars.forEach((bar, index) => {
    const intensity = Math.max(0.2, Math.sin((index + 1) * 0.8 + level * 4) * 0.5 + 0.5);
    bar.style.height = `${Math.max(10, intensity * 100)}%`;
    bar.classList.toggle('active', intensity > 0.6);
  });
}