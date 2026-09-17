const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

function football(discs) {
  return R.createGame({mode: 'football', players: 2, settings: {discs, targetScore: 4}});
}

function assertPlayable(game, expectedPerTeam) {
  const stones = game.objects.filter(object => object.kind === 'disc');
  const ball = game.objects.find(object => object.kind === 'ball');
  assert.equal(game.players, 2, 'football remains a two-team mode');
  assert.equal(stones.length, expectedPerTeam * 2, `${expectedPerTeam} stones per team`);
  assert.equal(game.settings.discs, expectedPerTeam, 'normalized stone count is stored');
  assert.ok(ball, 'football has a ball');

  const bounds = game.board.playfield;
  for (const object of [...stones, ball]) {
    assert.ok(object.x - object.radius >= bounds.x, `${object.id} left edge in pitch`);
    assert.ok(object.x + object.radius <= bounds.x + bounds.w, `${object.id} right edge in pitch`);
    assert.ok(object.y - object.radius >= bounds.y, `${object.id} top edge in pitch`);
    assert.ok(object.y + object.radius <= bounds.y + bounds.h, `${object.id} bottom edge in pitch`);
  }
  for (let i = 0; i < game.objects.length; i++) {
    for (let j = i + 1; j < game.objects.length; j++) {
      const a = game.objects[i], b = game.objects[j];
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius,
        `${a.id} and ${b.id} must not overlap`);
    }
  }
}

const three = football(3);
const five = football(5);
assertPlayable(three, 3);
assertPlayable(five, 5);
assert.ok(five.board.playfield.w > three.board.playfield.w, 'five-stone pitch must be wider');
assert.ok(five.board.playfield.h >= three.board.playfield.h, 'five-stone pitch must not be shorter');
assert.ok(five.board.playfield.w * five.board.playfield.h > three.board.playfield.w * three.board.playfield.h,
  'five-stone pitch must have a larger playable area');
assert.ok(five.board.goals.x2 - five.board.goals.x1 > three.board.goals.x2 - three.board.goals.x1,
  'larger pitch gets a wider goal mouth');

const unsupported = football(4);
assertPlayable(unsupported, 3);

R.resolve(five, [{type: 'goal', side: 'top'}]);
assert.deepEqual(five.scores, [1, 0], 'goal scoring still works with five stones');
assert.equal(five.settings.targetScore, 4, 'stone selection does not replace target score');

console.log(JSON.stringify({ok: true, three: three.board.playfield, five: five.board.playfield}));
