const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');
const AI = require('../games/ttak-club/v1.0.3/shared/ai');

for (const difficulty of ['easy','normal','hard']) {
  const game = R.createGame({mode:'curling', settings:{stonesPerTeam:4,ends:2}});
  game.turn = 1;
  const stone = R.eligibleObjects(game, 1)[0];
  stone.team = 1;
  const shot = AI.chooseShot(game, difficulty, 2401);
  assert.ok(shot && shot.id === stone.id, `${difficulty}: AI selects delivery stone`);
  assert.ok(shot.force.y < 0, `${difficulty}: AI throws toward the house`);
  P.applyShot(stone, shot.force);
  for(let step=0;step<30000&&!P.allResting(game.objects);step++) P.step(game.objects,1/120,game.board);
  const distance = Math.hypot(stone.x-game.board.house.center.x,stone.y-game.board.house.center.y);
  assert.ok(stone.active, `${difficulty}: stone stays on the sheet`);
  assert.ok(distance <= game.board.house.radius+stone.radius, `${difficulty}: AI delivery reaches the house, got ${distance.toFixed(1)}`);
}

console.log('ttak curling AI tests passed');
