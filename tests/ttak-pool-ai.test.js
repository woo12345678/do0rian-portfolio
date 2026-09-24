const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const AI = require('../games/ttak-club/v1.0.3/shared/ai');
const P = require('../games/ttak-club/v1.0.3/shared/physics');

function alignment(game, shot, target) {
  const cue = game.objects.find(object => object.kind === 'cue');
  const tx = target.x - cue.x, ty = target.y - cue.y;
  return (shot.force.x * tx + shot.force.y * ty) / (Math.hypot(shot.force.x, shot.force.y) * Math.hypot(tx, ty));
}

for (const difficulty of ['easy', 'normal', 'hard']) {
  const game = R.createGame({mode: 'pool', players: 2, settings: {firstPlayer: 'ai'}});
  game.poolGroups = ['stripes', 'solids'];
  const target = game.objects.find(object => object.number === 1);
  Object.assign(target, {x: 310, y: 430});
  for (const object of game.objects.filter(object => object.kind === 'pool' && object !== target && object.number !== 8)) object.active = false;
  const shot = AI.chooseShot(game, difficulty, 1234);
  assert.equal(shot.id, 'cue');
  assert.ok(alignment(game, shot, target) > (difficulty === 'easy' ? 0.9 : 0.97), `${difficulty} aims at legal solid`);
}

for (const difficulty of ['easy', 'normal', 'hard']) {
  const game = R.createGame({mode: 'pool', players: 2, settings: {firstPlayer: 'ai'}});
  const shot = AI.chooseShot(game, difficulty, 4321);
  assert.ok(R.markShot(game, shot.id));
  P.applyShot(game.objects.find(object => object.id === shot.id), shot.force);
  let events = [], settled = false;
  for (let step = 0; step < 12000; step++) {
    events = P.accumulateEvents(events, P.step(game.objects, 1 / 120, game.board));
    if (step > 30 && P.allResting(game.objects)) { settled = true; break; }
  }
  assert.ok(settled, `${difficulty} break shot settles`);
  R.resolve(game, events);
  assert.ok(['aiming', 'finished'].includes(game.phase), `${difficulty} break advances play`);
}

const eightGame = R.createGame({mode: 'pool', players: 2, settings: {firstPlayer: 'ai'}});
eightGame.poolGroups = ['stripes', 'solids'];
for (const object of eightGame.objects.filter(object => object.kind === 'pool' && object.number >= 1 && object.number <= 7)) object.active = false;
const eight = eightGame.objects.find(object => object.number === 8);
Object.assign(eight, {x: 760, y: 420});
const eightShot = AI.chooseShot(eightGame, 'hard', 19);
assert.ok(alignment(eightGame, eightShot, eight) > 0.97, 'AI aims at 8 after clearing its group');

console.log('ttak pool AI tests passed');
