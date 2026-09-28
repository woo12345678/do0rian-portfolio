const assert = require('node:assert/strict');
const F = require('../games/ttak-club/v1.0.3/shared/feedback');

assert.deepEqual(
  F.turnNotice({previousTurn: 0, nextTurn: 1, phase: 'aiming', ai: true}),
  {kind: 'change', from: 0, to: 1, ai: true}
);
assert.deepEqual(
  F.turnNotice({previousTurn: 0, nextTurn: 0, phase: 'aiming', ai: false}),
  {kind: 'continue', from: 0, to: 0, ai: false}
);
assert.deepEqual(
  F.turnNotice({previousTurn: 2, nextTurn: 2, phase: 'counter', ai: false}),
  {kind: 'counter', from: 2, to: 2, ai: false}
);
assert.equal(F.turnNotice({previousTurn: 0, nextTurn: 1, phase: 'finished', ai: false}), null);
console.log('ttak turn feedback tests passed');
