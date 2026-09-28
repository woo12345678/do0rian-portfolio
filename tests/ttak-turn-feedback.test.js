const assert = require('node:assert/strict');
const F = require('../games/ttak-club/v1.0.3/shared/feedback');

assert.deepEqual(
  F.turnNotice({mode: 'classic', previousTurn: 0, nextTurn: 1, phase: 'aiming', ai: true}),
  {kind: 'change', from: 0, to: 1, ai: true}
);
for (const mode of ['classic','football','line','golf','coop','royal','chain','pool']) {
  assert.deepEqual(
    F.turnNotice({mode, previousTurn: 0, nextTurn: 0, phase: 'aiming', ai: false}),
    {kind: 'same', from: 0, to: 0, ai: false},
    `${mode} must use neutral same-player wording`
  );
}
assert.deepEqual(
  F.turnNotice({mode: 'coop', previousTurn: 2, nextTurn: 2, phase: 'counter', ai: false}),
  {kind: 'counter', from: 2, to: 2, ai: false}
);
assert.deepEqual(
  F.turnNotice({mode: 'coop', previousTurn: 2, nextTurn: 2, phase: 'aiming', reason: 'counter-ended', ai: false}),
  {kind: 'counter-end', from: 2, to: 2, ai: false}
);
assert.equal(F.turnNotice({previousTurn: 0, nextTurn: 1, phase: 'finished', ai: false}), null);
console.log('ttak turn feedback tests passed');
