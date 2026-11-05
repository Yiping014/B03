import { dom } from './dom.js';
import { state } from './state.js';
import { HEALTH_RED } from './config.js';

const CORRECT_HEALTH_QUIZ_ANSWERS = new Set(['take-turns', 'lower-voice']);

export function showAlert(health) {
  dom.alertHealth.textContent = Math.round(health);
  dom.alertWarningContent.hidden = false;
  dom.healthQuizContent.hidden = true;
  dom.alertOverlay.hidden = false;
  state.stats.redAlerts += 1;
}

export function hideAlert() {
  dom.alertOverlay.hidden = true;
  dom.alertWarningContent.hidden = false;
  dom.healthQuizContent.hidden = true;
  dom.healthQuizFeedback.textContent = '';
  dom.healthQuizOptions.forEach((option) => { option.checked = false; });
  state.healthQuizActive = false;
  state.healthQuizStartedAt = 0;
}

function showHealthQuiz() {
  if (!state.healthQuizActive) {
    if (dom.alertOverlay.hidden) state.stats.redAlerts += 1;
    state.healthQuizActive = true;
    state.healthQuizStartedAt = performance.now();
  }
  dom.alertWarningContent.hidden = true;
  dom.healthQuizContent.hidden = false;
  dom.alertOverlay.hidden = false;
}

export function handleHealthAlert(health) {
  if (health <= 0) {
    showHealthQuiz();
    return;
  }
  if (health < HEALTH_RED) {
    if (dom.alertOverlay.hidden && !state.alertDismissed) {
      showAlert(health);
    } else if (!dom.alertOverlay.hidden) {
      dom.alertHealth.textContent = Math.round(health);
    }
  } else {
    hideAlert();
    state.alertDismissed = false;
  }
}

export function initAlert(onHealthQuizCorrect) {
  dom.alertCloseBtn.addEventListener('click', () => {
    hideAlert();
    state.alertDismissed = true; // 健康值回到紅色以上前，不再重複跳出
  });

  dom.healthQuizSubmitBtn.addEventListener('click', () => {
    const selected = new Set(
      dom.healthQuizOptions.filter((option) => option.checked).map((option) => option.value),
    );
    const isCorrect =
      selected.size === CORRECT_HEALTH_QUIZ_ANSWERS.size &&
      [...CORRECT_HEALTH_QUIZ_ANSWERS].every((answer) => selected.has(answer));

    if (!isCorrect) {
      dom.healthQuizFeedback.textContent = '再想一想：怎麼做才能讓大家的音量降下來？';
      return;
    }

    dom.healthQuizFeedback.textContent = '答對了！健康值恢復至 30，繼續保持。';
    onHealthQuizCorrect();
  });
}