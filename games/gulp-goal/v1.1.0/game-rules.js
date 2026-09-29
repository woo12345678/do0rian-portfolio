(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GulpGoalRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ARCHETYPES = ['launcher', 'twin-popper', 'goalie-breaker'];
  const WAVE_LENGTH = 105;
  const MAX_COMBO = 12;
  const OVERDRIVE_DURATION = 5;

  function hashSeed(value) {
    const text = String(value == null ? 'MAYHEM' : value);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h || 0x9e3779b9;
  }

  function rng(seed) {
    let a = hashSeed(seed);
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function canSwallow(holeDiameter, objectDiameter, overdrive) {
    return objectDiameter <= holeDiameter * (overdrive ? 1.28 : 0.82);
  }

  function resolveCollision(kind, holeDiameter, objectDiameter, overdrive) {
    if (kind === 'hazard') return 'bump';
    if (kind === 'capsule') return 'recruit';
    return canSwallow(holeDiameter, objectDiameter, overdrive) ? 'swallow' : 'bump';
  }

  function captureRadius(overdrive) { return overdrive ? 0.34 : 0.20; }

  function attractTowardLane(itemX, lane, dt, overdrive) {
    if (!overdrive || Math.abs(itemX - lane) > 0.62) return itemX;
    const amount = Math.min(0.05, Math.max(0, dt) * 0.72);
    return itemX + Math.max(-amount, Math.min(amount, lane - itemX));
  }

  function swallow(state, objectDiameter) {
    const combo = Math.min(MAX_COMBO, state.combo + 1);
    const gain = 0.6 + objectDiameter * 0.09 + combo * 0.05;
    return Object.assign({}, state, {
      diameter: Math.min(58, state.diameter + gain),
      combo,
      shotBonus: Math.max(0, Math.floor(state.shotBonus || 0)) + 1,
      score: state.score + Math.round(objectDiameter * 13 * (1 + combo * 0.08)),
      overdriveCharge: Math.min(100, state.overdriveCharge + 5 + combo * 0.45)
    });
  }

  function bump(state) {
    return Object.assign({}, state, { combo: 0, speedFactor: 0.48, bumpTime: 0.65 });
  }

  function applyGate(state, gate) {
    if (gate === 'crew') return Object.assign({}, state, { crew: state.crew + 8 });
    if (gate === 'volley') return Object.assign({}, state, { volleyMultiplier: state.volleyMultiplier * 2 });
    if (gate === 'focus') return Object.assign({}, state, { combo: Math.min(MAX_COMBO, state.combo + 4), overdriveCharge: Math.min(100, state.overdriveCharge + 18) });
    return Object.assign({}, state);
  }

  function activateOverdrive(state) {
    if (state.overdriveCharge < 100 || state.overdriveTime > 0) return Object.assign({}, state);
    return Object.assign({}, state, { overdriveCharge: 0, overdriveTime: OVERDRIVE_DURATION, overdriveVolleyArmed: true });
  }

  function tickOverdrive(state, dt) {
    return Object.assign({}, state, { overdriveTime: Math.max(0, state.overdriveTime - Math.max(0, dt)) });
  }

  function logicalVolley(state, wave) {
    const sizePower = Math.max(1, state.diameter / 15);
    const comboPower = 1 + state.combo * 0.14;
    const wavePower = Math.pow(4.35, Math.max(0, wave));
    const rainbow = state.overdriveTime > 0 || state.overdriveVolleyArmed === true;
    const overdrivePower = rainbow ? 2.2 : 1;
    const collectedPower = Math.round(Math.max(0, Math.floor(state.shotBonus || 0)) * wavePower);
    const logical = Math.min(999999, Math.max(1, Math.round((state.crew + 4) * sizePower * comboPower * state.volleyMultiplier * wavePower * overdrivePower) + collectedPower));
    return { logical, particles: Math.min(92, Math.max(12, Math.ceil(Math.sqrt(logical) * 3.2))), rainbow };
  }

  function previewVolley(state, wave) { return logicalVolley(state, wave).logical; }

  function projectGate(state, wave, gate) { return previewVolley(applyGate(state, gate), wave); }

  function previewEffect(state, wave, kind, objectDiameter, recruits) {
    const before = previewVolley(state, wave);
    let next = swallow(state, objectDiameter);
    if (kind === 'recruit') next = Object.assign({}, next, { crew: next.crew + Math.max(0, recruits || 0) });
    return { before, after: previewVolley(next, wave), state: next };
  }

  function feedProgress(waveTime) {
    return Math.max(0, Math.min(100, Math.round(Math.max(0, waveTime) / (WAVE_LENGTH - 6) * 100)));
  }

  function tickClarityPhase(clarity, dt, paused) {
    if (paused || clarity.phase !== 'launch') return Object.assign({}, clarity);
    const launchTime = Math.max(0, clarity.launchTime - Math.max(0, dt));
    return { phase: launchTime === 0 ? 'goal' : 'launch', launchTime };
  }

  function consumeVolleyArm(state) { return Object.assign({}, state, { overdriveVolleyArmed: false }); }

  function prepareVolley(state, wave) {
    const volley = logicalVolley(state, wave);
    return { volley, state: Object.assign({}, consumeVolleyArm(state), {
      preparedShotCount: volley.logical,
      preparedShotParticles: volley.particles,
      preparedShotRainbow: volley.rainbow
    }) };
  }

  function formation(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(Math.sqrt(i));
      const start = row * row;
      const inRow = i - start;
      out.push({
        archetype: ARCHETYPES[i % ARCHETYPES.length],
        x: (inRow - row / 2) * 8,
        y: row * 7 + (i % 2) * 0.8
      });
    }
    return out;
  }

  function generateWave(seed, wave) {
    const random = rng(String(seed) + ':wave:' + wave);
    const items = [];
    const rows = 16;
    for (let row = 0; row < rows; row++) {
      const y = 16 + row * 5.15;
      const count = row % 5 === 3 ? 2 : 3;
      const offset = random() * 0.7 - 0.35;
      for (let col = 0; col < count; col++) {
        let x = count === 2 ? (col ? 0.67 : -0.67) : (col - 1) * 0.66;
        x += offset;
        const big = (row + col + wave) % 7 === 5;
        items.push({
          id: wave + '-' + row + '-' + col,
          x: Math.max(-0.88, Math.min(0.88, x)), y,
          diameter: big ? 29 + wave * 3 : 7 + random() * (10 + wave * 2),
          kind: big ? 'hazard' : (row % 6 === 2 && col === 1 ? 'capsule' : 'food'),
          value: big ? 0 : 1
        });
      }
    }
    const gates = [
      { y: 48, left: 'crew', right: 'volley' },
      { y: 79, left: wave === 2 ? 'volley' : 'focus', right: 'crew' }
    ];
    return { length: WAVE_LENGTH, items, gates };
  }

  function validateLayout(layout) {
    for (const item of layout.items) {
      if (item.x < -0.9 || item.x > 0.9 || item.y < 0 || item.y > WAVE_LENGTH - 10) return false;
    }
    for (let i = 0; i < layout.items.length; i++) {
      for (let j = i + 1; j < layout.items.length; j++) {
        const a = layout.items[i], b = layout.items[j];
        if (Math.abs(a.y - b.y) < 2.2 && Math.abs(a.x - b.x) < 0.22) return false;
      }
    }
    return true;
  }

  function nextWave(wave, wonFinal) {
    if (wave < 2) return { terminal: false, wave: wave + 1, result: null };
    return { terminal: true, wave, result: wonFinal ? 'victory' : 'game-over' };
  }

  return { ARCHETYPES, WAVE_LENGTH, MAX_COMBO, OVERDRIVE_DURATION, hashSeed, rng, canSwallow, resolveCollision, captureRadius, attractTowardLane, swallow, bump, applyGate, activateOverdrive, tickOverdrive, logicalVolley, previewVolley, projectGate, previewEffect, feedProgress, tickClarityPhase, consumeVolleyArm, prepareVolley, formation, generateWave, validateLayout, nextWave };
});
