const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

for (const [difficulty, interval] of Object.entries({easy: 5, normal: 4, hard: 3})) {
  const game = R.createGame({mode: 'coop', players: 5, settings: {difficulty}});
  assert.equal(game.counterInterval, interval, `${difficulty} interval`);
  assert.equal(game.turnsUntilCounter, interval, `${difficulty} initial countdown`);
  for (let turn = 1; turn <= interval; turn++) {
    const disc = R.eligibleObjects(game)[0];
    assert.ok(R.markShot(game, disc.id), `${difficulty} shot ${turn}`);
    R.resolve(game, []);
    if (turn < interval) {
      assert.equal(game.phase, 'aiming', `${difficulty} no early counter at ${turn}`);
      assert.equal(game.turnsUntilCounter, interval - turn, `${difficulty} countdown ${turn}`);
    } else {
      assert.equal(game.phase, 'counter', `${difficulty} counter after ${interval}`);
      assert.equal(game.turnsUntilCounter, 0, `${difficulty} countdown reached zero`);
    }
  }
  const goblin = game.objects.find(object => object.kind === 'goblin');
  assert.ok(R.beginGoblinCounter(game, goblin.id));
  R.resolve(game, []);
  assert.equal(game.phase, 'aiming');
  assert.equal(game.turnsUntilCounter, interval, `${difficulty} countdown reset`);
}
console.log(JSON.stringify({ok: true, intervals: {easy: 5, normal: 4, hard: 3}}));
