export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function formatDb(value) {
  return `${Math.max(0, Math.round(value))} dB`;
}

export function levelToDb(level) {
  return clamp(20 * Math.log10(Math.max(level, 0.0001)) + 60, 0, 100);
}