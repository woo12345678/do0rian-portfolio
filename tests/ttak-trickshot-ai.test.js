const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const AI = require('../games/ttak-club/v1.0.3/shared/ai');

for (const difficulty of ['easy', 'normal', 'hard']) {
  const game = R.createGame({mode: 'chain', players: 5, rng: () => 0.4});
  game.turn = 1;
  const disc = R.eligibleObjects(game)[0];
  const target = game.objects.find(object => object.kind === 'target' && object.number === 1);
  Object.assign(target, {x: 1050, y: 650});
  const shot = AI.chooseShot(game, difficulty, 123);
  assert.ok(shot && Number.isFinite(shot.force.x) && Number.isFinite(shot.force.y));
  const toTarget = {x: target.x - disc.x, y: target.y - disc.y};
  const dot = (shot.force.x * toTarget.x + shot.force.y * toTarget.y) / (Math.hypot(shot.force.x, shot.force.y) * Math.hypot(toTarget.x, toTarget.y));
  assert.ok(dot > 0.9, `${difficulty} aims at target 1: ${dot}`);
}

const radial = R.createGame({mode: 'classic', players: 5, settings: {discs: 1}});
radial.turn = 4;
const radialDisc = R.eligibleObjects(radial)[0];
Object.assign(radialDisc, {x: 600, y: 600});
const radialTarget = radial.objects.find(object => object.team === 0);
Object.assign(radialTarget, {x: 900, y: 600});
for (const object of radial.objects) if (object !== radialDisc && object !== radialTarget) object.active = false;
const radialShot = AI.chooseShot(radial, 'hard', 7);
const radialDot = radialShot.force.x / Math.hypot(radialShot.force.x, radialShot.force.y);
assert.ok(radialDot > 0.9, `radial AI must aim toward actual opponent, got ${radialDot}`);
console.log(JSON.stringify({ok: true}));
