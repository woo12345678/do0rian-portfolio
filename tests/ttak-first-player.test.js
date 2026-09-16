const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

assert.equal(R.createGame({mode: 'classic', players: 5, settings: {firstPlayer: 'human'}}).turn, 0);
assert.equal(R.createGame({mode: 'classic', players: 5, settings: {firstPlayer: 'ai'}}).turn, 1);
assert.equal(R.createGame({mode: 'classic', players: 5, settings: {firstPlayer: 'random'}, rng: () => 0.99}).turn, 4);
assert.equal(R.createGame({mode: 'football', players: 5, settings: {firstPlayer: 'random'}, rng: () => 0.99}).turn, 1);
console.log(JSON.stringify({ok: true}));
