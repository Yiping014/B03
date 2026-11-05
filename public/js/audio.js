import { dom } from './dom.js';
import { state } from './state.js';
import { clamp, levelToDb } from './utils.js';

let audioContext = null;
let analyser = null;
let stream = null;

export function hasAnalyser() {
  return analyser !== null;
}

export async function openMicrophone() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('UNSUPPORTED');
  }

  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);
}

export function closeMicrophone() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
}

// 讀取目前的平均振幅（0 ~ 1 左右）
function readRawAverage() {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);

  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    sum += Math.abs((data[i] - 128) / 128);
  }
  return sum / data.length;
}

// 回傳平滑後的音量 level（原本 updateMeter 開頭那一段）
export function readLevel() {
  const rms = readRawAverage();
  const level = clamp(rms * 2.6, 0, 1.2);
  const smooth = state.lastLevel * 0.75 + level * 0.25;
  state.lastLevel = smooth;
  return smooth;
}

// 校正環境噪音
export function calibrateBaseline() {
  if (!analyser) {
    dom.feedbackBox.textContent = '請先啟動麥克風，再重新校正環境噪音。';
    dom.feedbackBox.className = 'feedback-box warning';
    return;
  }

  const samples = [];
  let count = 0;

  function collect() {
    if (!analyser) return;

    samples.push(readRawAverage());
    count += 1;

    if (count < 50) {
      requestAnimationFrame(collect);
      return;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const medianNoise = sorted[Math.floor(sorted.length / 2)];
    state.baseline = clamp(medianNoise * 1.8 + 0.08, 0.08, 0.45);

    dom.noiseValue.textContent = `${Math.round(levelToDb(state.baseline))} dB`;
    dom.statusText.textContent = '已校正';
    dom.statusText.className = 'status ok';
    dom.feedbackBox.textContent = '環境噪音已校正，討論開始後將即時回饋狀態。';
    dom.feedbackBox.className = 'feedback-box neutral';
  }

  collect();
}