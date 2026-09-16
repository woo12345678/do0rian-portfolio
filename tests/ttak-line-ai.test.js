const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const AI = require('../games/ttak-club/v1.0.3/shared/ai');

for (const layout of R.LINE_LAYOUTS) {
  const game = R.createGame({mode: 'line', players: 2, settings: {lineLayout: layout.id}});
  const disc = R.eligibleObjects(game)[0];
  const before = R.lineMeasure(game.board.targetLine, disc).distance;
  const shot = AI.chooseShot(game, 'hard', 1234);
  assert.ok(shot, `${layout.id}: AI should choose a shot`);
  assert.ok(Number.isFinite(shot.force.x) && Number.isFinite(shot.force.y), `${layout.id}: force must be finite`);
  const probe = {x: disc.x + shot.force.x * 0.05, y: disc.y + shot.force.y * 0.05};
  const after = R.lineMeasure(game.board.targetLine, probe).distance;
  assert.ok(after < before, `${layout.id}: AI force should move toward the line`);
}

console.log(JSON.stringify({ok: true, layouts: R.LINE_LAYOUTS.length}));
