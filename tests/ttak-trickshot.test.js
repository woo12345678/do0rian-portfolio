const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');

function events(numbers, team) { return numbers.map(number => ({type: 'target', number, team, id: `t${number}`})); }
function shot(game, numbers) {
  const disc = R.eligibleObjects(game)[0];
  assert.ok(R.markShot(game, disc.id));
  R.resolve(game, events(numbers, game.turn));
}

const game = R.createGame({mode: 'chain', players: 5, settings: {resetTurns: 2}, rng: (() => {let n = 0; return () => ((n++ * 0.173) % 1);})()});
assert.equal(game.players, 5);
assert.ok(game.board.restitution >= 0.94, 'trick-shot board must be bouncy');
assert.ok(game.board.friction <= 0.8, 'trick-shot board must preserve momentum');
const targets = game.objects.filter(object => object.kind === 'target');
assert.equal(targets.length, 5);
assert.equal(new Set(targets.map(object => `${object.x},${object.y}`)).size, 5);
assert.ok(targets.every(object => object.mass <= 1 && object.friction <= 0.8));

shot(game, [1, 2, 3]);
assert.equal(game.phase, 'aiming');
assert.equal(game.scores[0], 3);
assert.deepEqual(game.lastSequence, [1, 2, 3]);
const beforeReset = targets.map(object => `${object.x},${object.y}`).join('|');
shot(game, [1, 3, 2]);
assert.equal(game.phase, 'aiming');
assert.equal(game.targetResetCount, 1);
assert.notEqual(targets.map(object => `${object.x},${object.y}`).join('|'), beforeReset);

const wrong = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
shot(wrong, [1, 2, 4, 3, 5]);
assert.equal(wrong.scores[0], 2);
assert.equal(wrong.phase, 'aiming');

const repeated = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
shot(repeated, [1, 2, 1, 3, 4, 5]);
assert.notEqual(repeated.phase, 'finished', '1→2→1→3→4→5 must not be collapsed into a win');
assert.deepEqual(repeated.lastSequence, [1, 2, 1, 3, 4, 5]);

const consecutive = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
shot(consecutive, [1, 1, 2, 3, 4, 5]);
assert.notEqual(consecutive.phase, 'finished', '1→1→2→3→4→5 must not win');
assert.deepEqual(consecutive.lastSequence, [1, 1, 2, 3, 4, 5]);

const trailing = R.createGame({mode: 'chain', players: 2, settings: {resetTurns: 9}, rng: () => 0.4});
shot(trailing, [1, 2, 3, 4, 5, 1]);
assert.notEqual(trailing.phase, 'finished', '1→2→3→4→5→1 must not win');
assert.deepEqual(trailing.lastSequence, [1, 2, 3, 4, 5, 1]);
assert.ok(trailing.scores[0] < 5, 'invalid trailing impact must not display a completed score');

const winner = R.createGame({mode: 'chain', players: 5, settings: {resetTurns: 10}, rng: () => 0.4});
shot(winner, [1, 2, 3, 4, 5]);
assert.equal(winner.phase, 'finished');
assert.equal(winner.winner, 0);
assert.equal(winner.scores[0], 5);

const wallDisc = P.body({id: 'bounce', x: 1170, y: 300, radius: 25, vx: 100, friction: 0});
P.step([wallDisc], 0.1, {width: 1200, height: 720, walls: true, friction: 0, restitution: 0.96});
assert.ok(wallDisc.vx < -90, `custom restitution should keep bounce speed, got ${wallDisc.vx}`);
console.log(JSON.stringify({ok: true, winner: winner.winner, resetCount: game.targetResetCount}));
