const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

assert.ok(Array.isArray(R.LINE_LAYOUTS), 'LINE_LAYOUTS must be exported');
assert.ok(R.LINE_LAYOUTS.length >= 7, 'line mode needs at least seven layouts');
assert.deepEqual(new Set(R.LINE_LAYOUTS.map(layout => layout.kind)), new Set(['horizontal', 'vertical', 'diagonal']));

const pointDistance = (line, point) => {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  return Math.abs(dx * (point.y - line.a.y) - dy * (point.x - line.a.x)) / Math.hypot(dx, dy);
};
const launchDistances = R.LINE_LAYOUTS.flatMap(layout => layout.spawns.map(point => pointDistance(layout, point)));
assert.ok(Math.min(...launchDistances) < 260, 'include a close target line');
assert.ok(Math.max(...launchDistances) > 480, 'include a far target line');

const first = R.createGame({mode: 'line', players: 2, rng: () => 0});
const second = R.createGame({mode: 'line', players: 2, rng: () => 0});
assert.notEqual(first.board.targetLine.id, second.board.targetLine.id, 'consecutive maps must not repeat');
for (const game of [first, second]) {
  assert.ok(game.board.targetLine.a && game.board.targetLine.b, 'target line needs endpoints');
  assert.ok([-1, 1].includes(game.board.targetLine.safeSign), 'target line needs a safe side');
}

console.log(JSON.stringify({ok: true, layouts: R.LINE_LAYOUTS.length, kinds: [...new Set(R.LINE_LAYOUTS.map(x => x.kind))]}));
