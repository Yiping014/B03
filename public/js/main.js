import { dom } from './dom.js';
import { state, resetStats } from './state.js';
import { SAMPLE_INTERVAL, HEALTH_RED, HEALTH_YELLOW } from './config.js';
import { clamp, formatTime, formatDb, levelToDb } from './utils.js';
import { updateHealth } from './health.js';
import { setStatus, setRecoveryFeedback, updateHealthReminder, updateSignalBars } from './feedback.js';
import { handleHealthAlert, hideAlert, initAlert } from './alert.js';
import { openMicrophone, closeMicrophone, readLevel, calibrateBaseline, hasAnalyser } from './audio.js';
import { initLogin, showView } from './login.js';
import { renderReport } from './report.js';
import { generateSummary } from './ai.js';
import { sendToSheet } from './sheet.js';

let animationFrameId = null;

/* ---------- 重置畫面 ---------- */
function resetDashboard() {
  resetStats();
  state.currentHealth = 100;
  state.fastRecoveryActive = false;
  state.lastSampleAt = 0;
  state.alertDismissed = false;

  dom.noiseValue.textContent = `${Math.round(levelToDb(state.baseline))} dB`;
  dom.healthValue.textContent = '100';
  dom.healthScore.textContent = '100';
  dom.volumeValue.textContent = '0 dB';
  dom.volumeDisplay.textContent = '0 dB';
  dom.timeValue.textContent = '00:00';
  dom.healthFill.style.width = '100%';
  dom.healthFill.style.background = '#2fd57c';
  dom.volumeFill.style.width = '0%';
  dom.statusText.textContent = '待啟動';
  dom.statusText.className = 'status ok';
  dom.feedbackBox.textContent = '請開啟麥克風，讓系統開始偵測討論狀態。';
  dom.feedbackBox.className = 'feedback-box neutral';
  dom.healthReminder.hidden = true;
  dom.syncStatus.hidden = true;
  hideAlert();
}

/* ---------- 每個畫面影格更新 ---------- */
function updateMeter() {
  if (!hasAnalyser() || !state.isRunning) return;
  if (state.healthQuizActive) {
    animationFrameId = requestAnimationFrame(updateMeter);
    return;
  }

  const smooth = readLevel();
  updateSignalBars(smooth);

  const now = performance.now();
  const volumePercent = clamp(smooth * 100, 0, 100);
  const dbValue = levelToDb(smooth);

  if (now - state.lastSampleAt >= SAMPLE_INTERVAL || state.lastSampleAt === 0) {
    dom.volumeValue.textContent = formatDb(dbValue);
    dom.volumeDisplay.textContent = formatDb(dbValue);
    dom.volumeFill.style.width = `${volumePercent}%`;
    state.lastSampleAt = now;
  }

  if (now - state.lastDetectedAt >= SAMPLE_INTERVAL) {
    const environmentDb = Number(dom.noiseValue.textContent.replace(/\s*dB/i, '')) || 0;
    const previousHealth = state.currentHealth;
    const { health, elapsedSeconds } = updateHealth(dbValue, environmentDb, now);

    setStatus(dbValue - environmentDb, dbValue, environmentDb);
    if (health > previousHealth) setRecoveryFeedback(health);

    dom.healthFill.style.width = `${health}%`;
    dom.healthValue.textContent = `${Math.round(health)}`;
    dom.healthScore.textContent = `${Math.round(health)}`;

    updateHealthReminder(health);
    handleHealthAlert(health);

    // 累積整場統計（供總結頁使用）
    const stats = state.stats;
    const zone = health < HEALTH_RED ? 'red' : health < HEALTH_YELLOW ? 'yellow' : 'green';
    stats.seconds += elapsedSeconds;
    stats.dbSum += dbValue * elapsedSeconds;
    stats.dbMax = Math.max(stats.dbMax, dbValue);
    stats.minHealth = Math.min(stats.minHealth, health);
    stats.zone[zone] += elapsedSeconds;
    stats.history.push(health);

    if (smooth > state.baseline + 0.14) {
      state.recentHigh += 1;
    } else {
      state.recentHigh = Math.max(state.recentHigh - 1, 0);
    }
    dom.healthFill.style.filter = state.recentHigh > 15 ? 'saturate(1.2)' : 'none';

    state.lastDetectedAt = now;
  }

  dom.healthFill.style.background =
    state.currentHealth < HEALTH_RED ? '#e14b4b'
      : state.currentHealth < HEALTH_YELLOW ? '#f5c84c'
        : '#2fd57c';

  const elapsed = performance.now() - state.sessionStart;
  dom.timeValue.textContent = state.timeLimitMs
    ? formatTime(Math.max(state.timeLimitMs - elapsed, 0))
    : formatTime(elapsed);

  // 時間到，自動結束並進入總結頁
  if (state.timeLimitMs && elapsed >= state.timeLimitMs) {
    endDiscussion();
    return;
  }

  animationFrameId = requestAnimationFrame(updateMeter);
}

/* ---------- 開始 / 停止 / 結束 ---------- */
async function startMicrophone() {
  if (state.isRunning) {
    endDiscussion();
    return;
  }

  try {
    await openMicrophone();
  } catch (error) {
    dom.feedbackBox.textContent = error.message === 'UNSUPPORTED'
      ? '此瀏覽器不支援麥克風權限，請使用支援的瀏覽器。'
      : '請允許麥克風權限，系統才能進行討論狀態偵測。';
    dom.feedbackBox.className = 'feedback-box danger';
    console.error(error);
    return;
  }

  state.isRunning = true;
  resetStats();
  state.alertDismissed = false;
  hideAlert();
  dom.healthReminder.hidden = true;
  state.sessionStart = performance.now();
  state.lastDetectedAt = state.sessionStart;
  state.normalVolumeSince = null;
  dom.startBtn.textContent = '結束討論';
  dom.startBtn.classList.add('running');

  calibrateBaseline();
  updateMeter();
}

function stopMicrophone() {
  state.isRunning = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  closeMicrophone();

  state.lastLevel = 0;
  state.recentHigh = 0;
  state.lastDetectedAt = 0;
  state.lastSampleAt = 0;
  state.normalVolumeSince = null;
  state.currentHealth = 100;
  state.fastRecoveryActive = false;

  hideAlert();
  dom.healthReminder.hidden = true;
  dom.startBtn.textContent = '啟動麥克風';
  dom.startBtn.classList.remove('running');
  dom.statusText.textContent = '已停止';
  dom.statusText.className = 'status warning';
  dom.feedbackBox.textContent = '偵測已停止，可重新啟動麥克風繼續檢測。';
  dom.feedbackBox.className = 'feedback-box neutral';
}

function setSyncStatus(type, message) {
  dom.syncStatus.hidden = false;
  dom.syncStatus.className = `sync-status ${type}`;
  dom.syncStatus.textContent = message;
}

function resumeAfterHealthQuiz() {
  const now = performance.now();
  state.sessionStart += now - state.healthQuizStartedAt;
  state.currentHealth = 30;
  state.fastRecoveryActive = false;
  state.lastDetectedAt = now;
  state.normalVolumeSince = null;
  state.alertDismissed = true;

  dom.healthFill.style.width = '30%';
  dom.healthFill.style.background = '#e14b4b';
  dom.healthValue.textContent = '30';
  dom.healthScore.textContent = '30';
  dom.feedbackBox.textContent = '健康值恢復至 30 分，請繼續控制音量。';
  dom.feedbackBox.className = 'feedback-box danger';
  hideAlert();
}

function endDiscussion() {
  const durationMs = performance.now() - state.sessionStart;
  const finalHealth = state.currentHealth;
  stopMicrophone();
  renderReport(durationMs, finalHealth);
  showView('report');

  const base = { className: state.studentName, group: state.selectedGroup, finalHealth };

  setSyncStatus('pending', '資料傳送中…');
  dom.reportFeedback.textContent = 'AI 正在分析這次討論…';

  generateSummary(state.stats, state.selectedGroup)
    .then((text) => {
      dom.reportFeedback.textContent = text;
      return text;
    })
    .catch(() => dom.reportFeedback.textContent) // AI 失敗就沿用規則式回饋
    .then((feedback) => sendToSheet(state.stats, { ...base, aiFeedback: feedback }))
    .then((result) => setSyncStatus(result.ok ? 'success' : 'error', (result.ok ? '✓ ' : '✗ ') + result.message))
    .catch((e) => {
      console.error(e);
      setSyncStatus('error', '✗ 傳送時發生未預期的錯誤，請查看 Console。');
    });
}

/* ---------- 初始化 ---------- */
initAlert(resumeAfterHealthQuiz);
initLogin(() => {
  resetDashboard();
  showView('app');
});

dom.discussionBackBtn.addEventListener('click', () => {
  stopMicrophone();
  resetDashboard();
  showView('login');
});
dom.backBtn.addEventListener('click', () => {
  resetDashboard();
  showView('login');
});
dom.startBtn.addEventListener('click', startMicrophone);
dom.recalBtn.addEventListener('click', calibrateBaseline);

resetDashboard();
showView('login');