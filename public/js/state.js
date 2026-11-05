export const state = {
  isRunning: false,
  currentHealth: 100,
  fastRecoveryActive: false,
  baseline: 0.15,
  lastLevel: 0,
  sessionStart: 0,
  lastDetectedAt: 0,
  lastSampleAt: 0,
  normalVolumeSince: null,
  recentHigh: 0,
  selectedGroup: null,
  studentClass: '',
  timeLimitMs: 0,
  alertDismissed: false,
  healthQuizActive: false,
  healthQuizStartedAt: 0,
  stats: null,
};

export function resetStats() {
  state.stats = {
    seconds: 0, dbSum: 0, dbMax: 0, minHealth: 100,
    zone: { green: 0, yellow: 0, red: 0 },
    redAlerts: 0, history: [],
  };
}