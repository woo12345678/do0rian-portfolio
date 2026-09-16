const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

function pointAtSignedDistance(line, distance) {
  const midpoint = {x: (line.a.x + line.b.x) / 2, y: (line.a.y + line.b.y) / 2};
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const length = Math.hypot(dx, dy);
  return {
    x: midpoint.x + (-dy / length) * line.safeSign * distance,
    y: midpoint.y + (dx / length) * line.safeSign * distance
  };
}

function finishAt(layout, distances) {
  const game = R.createGame({mode: 'line', players: 2, settings: {lineLayout: layout}});
  distances.forEach((distance, team) => Object.assign(game.objects.find(o => o.team === team), pointAtSignedDistance(game.board.targetLine, distance)));
  game.phase = 'simulating';
  R.resolve(game, []);
  game.phase = 'simulating';
  R.resolve(game, []);
  return game;
}

const closest = finishAt('diag-rise', [18, 72]);
assert.equal(closest.phase, 'finished');
assert.equal(closest.winner, 0, 'closest legal stone should win on a diagonal line');
assert.ok(Math.abs(closest.attempts[0][0].distance - 18) < 0.001);

const crossed = finishAt('diag-fall', [-12, 55]);
assert.equal(crossed.winner, 1, 'a stone beyond the line must be illegal');
assert.equal(crossed.attempts[0][0].legal, false);

console.log(JSON.stringify({ok: true, diagonalWinner: closest.winner, crossingWinner: crossed.winner}));
