import { angularDistance, attemptCrack, bankBag, createGame, effectiveTargetWidth, registerHit, registerMiss, setPaused, shouldAcceptKey, tickGame } from './rules.mjs';

const $ = selector => document.querySelector(selector);
const screens = { title: $('#title-screen'), playing: $('#game-screen'), result: $('#result-screen') };
const canvas = $('#vault-canvas');
const ctx = canvas.getContext('2d');
const ui = {
  timer: $('#timer'), banked: $('#banked'), bag: $('#bag'), combo: $('#combo'), multiplier: $('#multiplier'),
  alarms: $('#alarms'), pips: $('#fever-pips'), vaults: $('#vault-count'), callout: $('#callout'), pause: $('#pause-curtain'),
  bankButton: $('#bank-button'), decisionMeter: $('#decision-meter'),
};
let state = null;
let screen = 'title';
let lastFrame = performance.now();
let lastTransition = -Infinity;
let muted = safeLoad('vault-muted', false);
let best = Number(safeLoad('vault-best', 0)) || 0;
let audio = null;
let seenEvent = -1;

function safeLoad(key, fallback) { try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
function safeSave(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional storage */ } }
function formatScore(value) { return Math.round(value).toLocaleString('ko-KR'); }
function show(name) { screen = name; Object.entries(screens).forEach(([key, node]) => node.classList.toggle('active', key === name)); }

function start(seed = Math.floor(Date.now() / 86400000)) {
  state = createGame(seed); seenEvent = state.eventId; show('playing'); lastFrame = performance.now(); lastTransition = -Infinity; unlockAudio(); updateUI();
}

function finish() {
  if (screen === 'result') return;
  if (state.banked > best) { best = state.banked; safeSave('vault-best', best); $('#new-best').textContent = '새 최고 기록!'; } else $('#new-best').textContent = '';
  $('#result-reason').textContent = state.endReason === 'alarm' ? '경보 3번으로 작전을 접었습니다.' : '90초가 끝났습니다. 챙긴 것만 점수입니다.';
  $('#final-score').textContent = formatScore(state.banked); $('#final-best').textContent = formatScore(best);
  $('#final-combo').textContent = state.maxCombo; $('#final-perfects').textContent = state.perfectCount; $('#final-vaults').textContent = state.vaultsOpened;
  $('#title-best').textContent = formatScore(best); show('result');
}

function unlockAudio() {
  if (muted) return;
  if (!audio) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (AudioContext) audio = new AudioContext(); }
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
}
function tone(frequency, duration, type = 'triangle', delay = 0, volume = 0.06) {
  if (muted || !audio) return;
  const oscillator = audio.createOscillator(); const gain = audio.createGain(); oscillator.type = type; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
  oscillator.connect(gain).connect(audio.destination); oscillator.start(audio.currentTime + delay); oscillator.stop(audio.currentTime + delay + duration);
}
function sound(event, quality) {
  if (event === 'miss') { tone(105, 0.24, 'sawtooth', 0, 0.08); tone(78, 0.28, 'square', 0.08, 0.03); }
  else if (event === 'bank') { tone(330, 0.12); tone(495, 0.18, 'triangle', 0.1); }
  else if (event === 'chamber') [262, 330, 392, 523].forEach((note, i) => tone(note, 0.2, 'triangle', i * 0.07));
  else if (quality === 'PERFECT') { tone(660, 0.08, 'square', 0, 0.04); tone(990, 0.18, 'triangle', 0.06); }
  else tone(quality === 'GREAT' ? 520 : 390, 0.13);
}
function announce(text) { ui.callout.textContent = text; ui.callout.classList.remove('pop'); void ui.callout.offsetWidth; ui.callout.classList.add('pop'); }
function transitionAllowed() { return performance.now() - lastTransition >= 120; }

function crack() {
  if (!state || screen !== 'playing' || state.paused || !transitionAllowed()) return;
  unlockAudio();
  const before = state; const distance = angularDistance(state.needleAngle, state.targetAngle); const halfWidth = effectiveTargetWidth(state) / 2;
  state = attemptCrack(state);
  if (state === before) return;
  lastTransition = performance.now();
  if (state.lastEvent === 'miss') announce(distance <= halfWidth * 1.25 ? '아깝다! NEAR MISS' : '철컥! MISS');
  processEvent(); updateUI(); if (state.phase === 'result') finish();
}
function bank() {
  if (!state || screen !== 'playing' || state.paused || !transitionAllowed()) return;
  const before = state; state = bankBag(state); if (state === before) return;
  lastTransition = performance.now(); unlockAudio(); announce('안전하게 챙겼다!'); processEvent(); updateUI();
}
function togglePause(force) {
  if (!state || screen !== 'playing' || state.phase !== 'playing') return;
  state = setPaused(state, force ?? !state.paused); ui.pause.hidden = !state.paused; $('#pause-button').textContent = state.paused ? '계속하기 P' : '일시정지 P'; $('#pause-button').setAttribute('aria-pressed', String(state.paused)); lastFrame = performance.now();
}
function processEvent() {
  if (state.eventId === seenEvent) return; seenEvent = state.eventId; sound(state.lastEvent, state.lastQuality);
  if (state.lastEvent === 'chamber') announce(`금고실 ${state.vaultsOpened} OPEN! +${state.config.chamberBonus}`);
  else if (state.lastEvent === 'hit') announce(state.lastQuality);
}
function updateUI() {
  if (!state) return;
  ui.timer.textContent = state.timeLeft.toFixed(1); ui.banked.textContent = formatScore(state.banked); ui.bag.textContent = formatScore(state.bag);
  ui.combo.textContent = state.combo; ui.multiplier.textContent = `×${state.multiplier.toFixed(2)}`; ui.vaults.textContent = `CHAMBER ${state.vaultsOpened}`;
  ui.alarms.innerHTML = [0, 1, 2].map(i => `<i class="${i < state.alarms ? 'lit' : ''}">●</i>`).join(' '); ui.alarms.setAttribute('aria-label', `경보 ${state.alarms}/3`);
  ui.pips.textContent = state.feverActive ? `${state.feverAttempts} ATTEMPTS` : [0, 1, 2].map(i => i < state.feverCharge ? '●' : '○').join(' ');
  ui.pips.classList.toggle('hot', state.feverActive || state.feverArmed);
  ui.bankButton.disabled = !state.bankAvailable || state.bag <= 0; ui.bankButton.classList.toggle('ready', !ui.bankButton.disabled);
  ui.bankButton.firstChild.textContent = state.bankAvailable ? '지금 챙기기 ' : '챙기기 ';
  ui.decisionMeter.style.transform = `scaleX(${Math.max(0, state.decisionRemaining / state.config.decisionDuration)})`;
}

function drawBand(cx, cy, radius, totalWidth, color, lineWidth) {
  const half = totalWidth / 2; ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(cx, cy, radius, state.targetAngle - half, state.targetAngle + half); ctx.stroke();
}
function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const backingWidth = Math.max(1, Math.round(rect.width * dpr));
  const backingHeight = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: rect.width, height: rect.height };
}
function draw() {
  if (!state) return;
  const { width: w, height: h } = syncCanvasSize(); const cx = w / 2; const cy = h / 2 + 12; const radius = Math.min(w, h) * 0.36;
  ctx.clearRect(0, 0, w, h); ctx.save(); ctx.fillStyle = state.vaultsOpened % 2 ? '#d6c993' : '#f3e4c2'; ctx.strokeStyle = '#182033'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(cx, cy, radius + 48, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, radius + 30, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 40; i += 1) { const angle = i / 40 * TAU; const long = i % 5 === 0; ctx.lineWidth = long ? 6 : 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(angle) * (radius - 18), cy + Math.sin(angle) * (radius - 18)); ctx.lineTo(cx + Math.cos(angle) * (radius - (long ? 45 : 32)), cy + Math.sin(angle) * (radius - (long ? 45 : 32))); ctx.stroke(); }
  const width = effectiveTargetWidth(state); drawBand(cx, cy, radius - 8, width, '#d49a35', 34); drawBand(cx, cy, radius - 8, width * 0.65, '#4fa98f', 22); drawBand(cx, cy, radius - 8, width * 0.3, '#d65245', 11);
  ctx.strokeStyle = '#182033'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, radius - 8, state.targetAngle - width / 2, state.targetAngle + width / 2); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.needleAngle); ctx.fillStyle = '#f8edcf'; ctx.strokeStyle = '#182033'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(radius + 12, 0); ctx.lineTo(-30, -10); ctx.lineTo(-30, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#d49a35'; ctx.beginPath(); ctx.arc(cx, cy, 35, 0, TAU); ctx.fill(); ctx.strokeStyle = '#182033'; ctx.lineWidth = 7; ctx.stroke(); ctx.fillStyle = '#182033'; ctx.font = '900 24px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(state.feverActive ? 'F' : 'V', cx, cy + 1);
  [[cx - radius - 28, cy - radius - 28], [cx + radius + 28, cy - radius - 28], [cx - radius - 28, cy + radius + 28], [cx + radius + 28, cy + radius + 28]].forEach(([x, y]) => { ctx.fillStyle = '#292728'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); });
  if (state.feverActive) { ctx.strokeStyle = '#d65245'; ctx.lineWidth = 7; ctx.setLineDash([18, 12]); ctx.beginPath(); ctx.arc(cx, cy, radius + 62, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
const TAU = Math.PI * 2;
function frame(now) {
  if (state && screen === 'playing' && state.phase === 'playing' && !state.paused) { state = tickGame(state, Math.min((now - lastFrame) / 1000, 0.05)); updateUI(); if (state.phase === 'result') finish(); }
  lastFrame = now; if (screen === 'playing') draw(); requestAnimationFrame(frame);
}

$('#start-button').addEventListener('click', () => start()); $('#replay-button').addEventListener('click', () => start());
$('#crack-button').addEventListener('click', crack); canvas.addEventListener('pointerdown', crack); $('#bank-button').addEventListener('click', bank);
$('#pause-button').addEventListener('click', () => togglePause()); $('#resume-button').addEventListener('click', () => togglePause(false));
$('#mute-button').addEventListener('click', () => { muted = !muted; safeSave('vault-muted', muted); $('#mute-button').textContent = muted ? '소리 끔 M' : '소리 켬 M'; $('#mute-button').setAttribute('aria-pressed', String(muted)); if (!muted) unlockAudio(); });
document.addEventListener('keydown', event => { if (!shouldAcceptKey(event)) return; event.preventDefault(); if (event.code === 'Space') crack(); else if (event.code === 'KeyB') bank(); else if (event.code === 'KeyP' || event.code === 'Escape') togglePause(); else if (event.code === 'KeyM') $('#mute-button').click(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state?.phase === 'playing') togglePause(true); });
$('#title-best').textContent = formatScore(best); $('#mute-button').textContent = muted ? '소리 끔 M' : '소리 켬 M'; $('#mute-button').setAttribute('aria-pressed', String(muted)); $('#pause-button').setAttribute('aria-pressed', 'false'); requestAnimationFrame(frame);

function debugApply(action) { if (!state || state.phase !== 'playing') return; state = action(state); processEvent(); updateUI(); if (state.phase === 'result') finish(); }
window.__VAULT_CREW__ = Object.freeze({
  getState: () => Object.freeze(state ? { phase: state.phase, paused: state.paused, timeLeft: state.timeLeft, banked: state.banked, bag: state.bag, combo: state.combo, multiplier: state.multiplier, alarms: state.alarms, bankAvailable: state.bankAvailable, decisionRemaining: state.decisionRemaining, feverActive: state.feverActive, feverArmed: state.feverArmed, feverAttempts: state.feverAttempts, perfectCount: state.perfectCount, vaultsOpened: state.vaultsOpened } : { phase: 'title' }),
  actions: Object.freeze({ start: () => start(1), crack, bank, pause: () => togglePause(true), resume: () => togglePause(false), advance: seconds => debugApply(game => tickGame(game, Math.max(0, Math.min(Number(seconds) || 0, 1)))), perfect: () => debugApply(game => registerHit(game, 'PERFECT')), miss: () => debugApply(registerMiss) }),
});
