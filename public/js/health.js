import { clamp } from './utils.js';
import { state } from './state.js';
import { HEALTH_RED, HEALTH_REFERENCE_INTERVAL, NORMAL_VOLUME_DELAY } from './config.js';

function deductionPerSecond(excessDb) {
  return excessDb <= 10
    ? 8 + (excessDb / 10) * 2
    : excessDb <= 30
      ? 8 - ((excessDb - 10) / 20) * 3
      : 5 - (Math.min(excessDb - 30, 20) / 20) * 2;
}

export function updateHealth(dbValue, environmentDb, now) {
  const excessDb = Math.max(0, dbValue - environmentDb - 3);
  const isNormalVolume = dbValue <= environmentDb + 2;
  const elapsedSeconds = (now - state.lastDetectedAt) / 1000;

  if (excessDb > 0) {
    state.normalVolumeSince = null;
    state.currentHealth -= deductionPerSecond(excessDb) * elapsedSeconds;
  } else if (isNormalVolume) {
    if (state.normalVolumeSince === null) state.normalVolumeSince = now;
    const recoveryStart = Math.max(state.lastDetectedAt, state.normalVolumeSince + NORMAL_VOLUME_DELAY);
    const recoverySeconds = Math.max(0, now - recoveryStart) / 1000;
    if (state.currentHealth < 100) {
      const normalRecoveryPerSecond = 7 / (HEALTH_REFERENCE_INTERVAL / 1000);
      const fastRecoveryPerSecond = normalRecoveryPerSecond * 2;
      const fastRecoveryTarget = HEALTH_RED;
      if (state.currentHealth < 20) state.fastRecoveryActive = true;
      const fastRecoverySeconds = Math.min(
        state.fastRecoveryActive ? recoverySeconds : 0,
        Math.max(0, (fastRecoveryTarget - state.currentHealth) / fastRecoveryPerSecond),
      );
      const normalRecoverySeconds = recoverySeconds - fastRecoverySeconds;
      state.currentHealth +=
        fastRecoveryPerSecond * fastRecoverySeconds +
        normalRecoveryPerSecond * normalRecoverySeconds;
      if (state.fastRecoveryActive && state.currentHealth >= fastRecoveryTarget) {
        state.fastRecoveryActive = false;
      }
    }
  } else {
    state.normalVolumeSince = null;
  }

  state.currentHealth = clamp(state.currentHealth, 0, 100);
  if (state.currentHealth < 20) state.fastRecoveryActive = true;
  return { health: state.currentHealth, elapsedSeconds };
}