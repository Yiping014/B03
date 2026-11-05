import { dom } from './dom.js';
import { state } from './state.js';

export function showView(name) {
  dom.loginView.hidden = name !== 'login';
  dom.appView.hidden = name !== 'app';
  dom.reportView.hidden = name !== 'report';
}

// onEnter：按「進入討論」時要做的事（由 main.js 傳進來，避免循環引用）
export function initLogin(onEnter) {
  dom.groupButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.groupButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedGroup = btn.dataset.group;
      dom.enterBtn.disabled = false;
    });
  });

  dom.enterBtn.addEventListener('click', () => {
    if (!state.selectedGroup) return;
    state.studentClass = dom.classInput.value.trim();
    dom.classBadge.textContent = `班級：${state.studentClass || '未填寫'}`;
    state.timeLimitMs = Number(dom.durationSelect.value) * 60000;
    dom.timeLabel.textContent = state.timeLimitMs ? '剩餘時間' : '討論時間';
    dom.groupBadge.textContent = `${state.selectedGroup} 組`;
    onEnter();
  });
}