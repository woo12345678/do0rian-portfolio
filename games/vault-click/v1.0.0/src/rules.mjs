const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export const DEFAULT_CONFIG = Object.freeze({
  duration: 90,
  decisionDuration: 0.7,
  baseSpeed: 120 * DEG,
  maxSpeed: 210 * DEG,
  speedStep: 10 * DEG,
  firstTargetWidth: 55 * DEG,
  baseTargetWidth: 48 * DEG,
  minTargetWidth: 28 * DEG,
  widthStep: 2 * DEG,
  chamberWidthBonus: 6 * DEG,
  chamberBonus: 400,
  maxMultiplier: 3,
  multiplierStep: 0.25,
});

const PAYOUT = Object.freeze({ GOOD: 100, GREAT: 150, PERFECT: 250 });

function normalize(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

export function angularDistance(a, b) {
  const difference = Math.abs(normalize(a) - normalize(b));
  return Math.min(difference, TAU - difference);
}

export function qualityForHit(distance, totalTargetWidth) {
  const ratio = distance / (totalTargetWidth / 2);
  if (ratio <= 0.3) return 'PERFECT';
  if (ratio <= 0.65) return 'GREAT';
  if (ratio <= 1) return 'GOOD';
  return null;
}

function nextRandom(seed) {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;
  return { seed: value || 0x9e3779b9, value: value / 0x100000000 };
}

function difficultyValues(difficulty, config, chamberTarget = false) {
  const speed = Math.min(config.maxSpeed, config.baseSpeed + difficulty * config.speedStep);
  const normalWidth = Math.max(config.minTargetWidth, config.baseTargetWidth - difficulty * config.widthStep);
  return { speed, width: normalWidth + (chamberTarget ? config.chamberWidthBonus : 0) };
}

function fairTarget(game, speed) {
  const random = nextRandom(game.randomSeed);
  const minTime = 0.65;
  const maxTime = 1.55;
  const travelTime = minTime + random.value * (maxTime - minTime);
  let angle = normalize(game.needleAngle + speed * travelTime);
  const minimumSeparation = 35 * DEG;
  if (angularDistance(angle, game.targetAngle) < minimumSeparation) {
    const early = normalize(game.needleAngle + speed * minTime);
    const late = normalize(game.needleAngle + speed * maxTime);
    angle = angularDistance(early, game.targetAngle) > angularDistance(late, game.targetAngle) ? early : late;
  }
  return { seed: random.seed, angle };
}

export function createGame(seed = Date.now(), config = {}) {
  const merged = Object.freeze({ ...DEFAULT_CONFIG, ...config });
  const needleAngle = -Math.PI / 2;
  return {
    phase: 'playing', endReason: null, timeLeft: merged.duration,
    needleAngle,
    targetAngle: normalize(needleAngle + merged.baseSpeed * 1.2),
    randomSeed: Number(seed) || 1,
    bag: 0, banked: 0, combo: 0, consecutiveHits: 0, maxCombo: 0,
    multiplier: 1, difficulty: 0, speed: merged.baseSpeed,
    targetWidth: merged.firstTargetWidth,
    alarms: 0, perfectCount: 0, feverCharge: 0,
    feverArmed: false, feverActive: false, feverAttempts: 0,
    vaultsOpened: 0, bankAvailable: false, decisionRemaining: 0,
    lastQuality: null, lastEvent: 'start', eventId: 0, paused: false,
    config: merged,
  };
}

function playable(game) {
  return game.phase === 'playing' && !game.paused;
}

export function effectiveTargetWidth(game) {
  return game.targetWidth * (game.feverActive ? 1.5 : 1);
}

export function registerHit(game, quality) {
  if (!playable(game) || !PAYOUT[quality] || game.bankAvailable) return game;
  const combo = game.combo + 1;
  const difficulty = game.difficulty + 1;
  const chamber = (game.consecutiveHits + 1) % 5 === 0;
  const values = difficultyValues(difficulty, game.config, chamber);
  const target = fairTarget(game, values.speed);
  const inFever = game.feverActive;
  const feverAttempts = inFever ? game.feverAttempts - 1 : game.feverAttempts;
  const isPerfect = quality === 'PERFECT';
  const feverCharge = !inFever && isPerfect ? game.feverCharge + 1 : game.feverCharge;
  const armsFever = !inFever && feverCharge >= 3;
  const payout = PAYOUT[quality] * game.multiplier * (inFever ? 2 : 1);
  return {
    ...game,
    bag: game.bag + payout + (chamber ? game.config.chamberBonus : 0),
    combo,
    consecutiveHits: game.consecutiveHits + 1,
    maxCombo: Math.max(game.maxCombo, combo),
    multiplier: Math.min(game.config.maxMultiplier, game.multiplier + game.config.multiplierStep),
    difficulty, speed: values.speed, targetWidth: values.width,
    targetAngle: target.angle, randomSeed: target.seed,
    perfectCount: game.perfectCount + (isPerfect ? 1 : 0),
    feverCharge: armsFever ? 0 : feverCharge,
    feverArmed: armsFever,
    feverActive: inFever && feverAttempts > 0,
    feverAttempts: Math.max(0, feverAttempts),
    vaultsOpened: game.vaultsOpened + (chamber ? 1 : 0),
    bankAvailable: true, decisionRemaining: game.config.decisionDuration,
    lastQuality: quality, lastEvent: chamber ? 'chamber' : 'hit', eventId: game.eventId + 1,
  };
}

export function registerMiss(game) {
  if (!playable(game) || game.bankAvailable) return game;
  const alarms = game.alarms + 1;
  const difficulty = Math.max(0, game.difficulty - 3);
  const values = difficultyValues(difficulty, game.config);
  const target = fairTarget(game, values.speed);
  return {
    ...game,
    phase: alarms >= 3 ? 'result' : game.phase,
    endReason: alarms >= 3 ? 'alarm' : null,
    bag: 0, combo: 0, consecutiveHits: 0, multiplier: 1,
    difficulty, speed: values.speed, targetWidth: values.width,
    targetAngle: target.angle, randomSeed: target.seed,
    alarms, feverArmed: false, feverActive: false, feverAttempts: 0,
    bankAvailable: false, decisionRemaining: 0,
    lastQuality: null, lastEvent: 'miss', eventId: game.eventId + 1,
  };
}

function activateArmedFever(game) {
  if (!game.feverArmed) return game;
  return { ...game, feverArmed: false, feverActive: true, feverAttempts: 3 };
}

export function bankBag(game) {
  if (!playable(game) || !game.bankAvailable || game.bag <= 0) return game;
  const values = difficultyValues(0, game.config, game.lastEvent === 'chamber');
  const target = fairTarget(game, values.speed);
  return activateArmedFever({
    ...game,
    banked: game.banked + game.bag, bag: 0,
    combo: 0, consecutiveHits: 0, multiplier: 1, difficulty: 0,
    speed: values.speed, targetWidth: values.width,
    targetAngle: target.angle, randomSeed: target.seed,
    bankAvailable: false, decisionRemaining: 0,
    lastEvent: 'bank', eventId: game.eventId + 1,
  });
}

export function tickGame(game, seconds) {
  if (!playable(game) || !Number.isFinite(seconds) || seconds <= 0) return game;
  const timeLeft = Math.max(0, game.timeLeft - seconds);
  if (timeLeft === 0) return { ...game, phase: 'result', endReason: 'time', timeLeft: 0 };
  const decisionConsumed = game.bankAvailable ? Math.min(seconds, game.decisionRemaining) : 0;
  const movementSeconds = seconds - decisionConsumed;
  const rawDecisionRemaining = Math.max(0, game.decisionRemaining - seconds);
  const decisionRemaining = rawDecisionRemaining <= 1e-9 ? 0 : rawDecisionRemaining;
  const decisionExpired = game.bankAvailable && decisionRemaining === 0;
  let next = {
    ...game,
    timeLeft,
    needleAngle: movementSeconds === 0 ? game.needleAngle : normalize(game.needleAngle + game.speed * movementSeconds),
    decisionRemaining,
    bankAvailable: game.bankAvailable && !decisionExpired,
  };
  if (decisionExpired) next = activateArmedFever(next);
  return next;
}

export function setPaused(game, paused) {
  if (game.phase !== 'playing' || game.paused === Boolean(paused)) return game;
  return { ...game, paused: Boolean(paused), lastEvent: paused ? 'pause' : 'resume' };
}

export function attemptCrack(game) {
  if (!playable(game) || game.bankAvailable) return game;
  const quality = qualityForHit(angularDistance(game.needleAngle, game.targetAngle), effectiveTargetWidth(game));
  return quality ? registerHit(game, quality) : registerMiss(game);
}

const MAPPED_KEYS = new Set(['Space', 'KeyB', 'KeyP', 'Escape', 'KeyM']);
export function shouldAcceptKey({ code, repeat }) {
  return !repeat && MAPPED_KEYS.has(code);
}
