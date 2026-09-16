const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

for (const mode of R.MODES) {
  const game = R.createGame({mode, players: 5, settings: {discs: 3, lineLayout: 'h-far'}, rng: () => 0.25});
  const expected = mode === 'football' ? 2 : 5;
  assert.equal(game.players, expected, `${mode} player count`);
  const teams = new Set(game.objects.filter(object => object.kind === 'disc').map(object => object.team));
  assert.equal(teams.size, expected, `${mode} active teams`);
  for (const object of game.objects.filter(object => object.kind === 'disc')) {
    assert.ok(object.x >= object.radius && object.x <= game.board.width - object.radius, `${mode} x in bounds`);
    assert.ok(object.y >= object.radius && object.y <= game.board.height - object.radius, `${mode} y in bounds`);
  }
}

const line = R.createGame({mode: 'line', players: 5, settings: {lineLayout: 'diag-rise'}, rng: () => 0.5});
const positions = new Set(line.objects.map(object => `${object.x},${object.y}`));
assert.equal(positions.size, 5, 'five line players must not overlap');
console.log(JSON.stringify({ok: true, modes: R.MODES.length}));
