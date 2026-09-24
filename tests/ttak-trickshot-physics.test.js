const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');

const game = R.createGame({mode: 'chain', players: 1, rng: () => 0.5});
const disc = game.objects.find(object => object.kind === 'disc');
Object.assign(disc, {x: 180, y: 360, vx: 0, vy: 0});
for (const target of game.objects.filter(object => object.kind === 'target')) Object.assign(target, {x: 300 + (target.number - 1) * 60, y: 360, vx: 0, vy: 0});
assert.equal(R.markShot(game, disc.id), true);
P.applyShot(disc, {x: 1250, y: 0});
let events = [];
for (let step = 0; step < 3600; step++) {
  events = P.accumulateEvents(events, P.step(game.objects, 1 / 120, game.board));
  if (step > 30 && P.allResting(game.objects)) break;
}
const sequence = events.filter(event => event.type === 'target').map(event => event.number);
R.resolve(game, events);
assert.deepEqual(sequence.slice(0, 5), [1, 2, 3, 2, 1]);
assert.notEqual(game.phase, 'finished', 'a physical back-collision must invalidate strict 1→3 order');
assert.deepEqual(game.lastSequence.slice(0, 5), [1, 2, 3, 2, 1]);
console.log(JSON.stringify({ok: true, sequence, winner: game.winner}));
