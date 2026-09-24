const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

assert.ok(R.MODES.includes('pool'), 'pool must be a selectable mode');
const game = R.createGame({mode: 'pool', players: 5});
assert.equal(game.players, 2, '8-ball pool is always two-player');
assert.equal(game.board.surface, 'pool');
assert.equal(game.board.walls, true);
assert.equal(game.board.pockets.length, 6, 'pool table needs six pockets');

const cue = game.objects.find(object => object.kind === 'cue');
const balls = game.objects.filter(object => object.kind === 'pool');
assert.ok(cue?.active, 'cue ball exists');
assert.deepEqual(balls.map(ball => ball.number).sort((a, b) => a - b), Array.from({length: 15}, (_, index) => index + 1));
const eight = balls.find(ball => ball.number === 8);
assert.equal(eight.x, 600, '8-ball is centered in the rack');
const backRow = balls.filter(ball => Math.abs(ball.y - Math.max(...balls.map(item => item.y))) < 0.01).sort((a, b) => a.x - b.x);
assert.equal(backRow.length, 5);
assert.notEqual(backRow[0].number <= 7, backRow[4].number <= 7, 'back corners contain one solid and one stripe');
assert.equal(new Set(game.objects.map(object => object.id)).size, 16, 'pool object IDs are unique');
assert.deepEqual(game.poolGroups, [null, null], 'table begins open');
assert.deepEqual(R.eligibleObjects(game).map(object => object.id), [cue.id], 'only the cue ball can be shot');

for (let a = 0; a < game.objects.length; a++) for (let b = a + 1; b < game.objects.length; b++) {
  const one = game.objects[a], two = game.objects[b];
  assert.ok(Math.hypot(one.x - two.x, one.y - two.y) >= one.radius + two.radius - 0.01, `${one.id}/${two.id} overlap`);
}
console.log('ttak pool setup tests passed');
