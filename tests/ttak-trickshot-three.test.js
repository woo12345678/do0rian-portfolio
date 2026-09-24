const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

const game = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
const targets = game.objects.filter(object => object.kind === 'target');
assert.deepEqual(targets.map(target => target.number), [1, 2, 3], 'trick shot should use three ordered targets');

assert.equal(R.markShot(game, R.eligibleObjects(game)[0].id), true);
R.resolve(game, [1, 2, 3].map(number => ({type: 'target', number})));
assert.equal(game.phase, 'finished', '1→2→3 in one shot should finish the match');
assert.equal(game.winner, 0);
assert.equal(game.scores[0], 3);

const wrong = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
assert.equal(R.markShot(wrong, R.eligibleObjects(wrong)[0].id), true);
R.resolve(wrong, [1, 3, 2].map(number => ({type: 'target', number})));
assert.notEqual(wrong.phase, 'finished', 'wrong order must not win');
assert.equal(wrong.scores[0], 1);

console.log('ttak trick-shot 1→3 tests passed');
