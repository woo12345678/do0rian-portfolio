const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

function ball(game, number) { return game.objects.find(object => object.kind === 'pool' && object.number === number); }
function play(game, {hit, pocket = [], scratch = false}) {
  const cue = game.objects.find(object => object.kind === 'cue');
  assert.equal(R.markShot(game, cue.id), true);
  const events = [];
  if (hit != null) events.push({type: 'cue-hit', id: ball(game, hit)?.id, number: hit});
  for (const number of pocket) {
    const object = ball(game, number); object.active = false;
    events.push({type: 'pocket', id: object.id, number, kind: 'pool'});
  }
  if (scratch) {
    cue.active = false;
    events.push({type: 'pocket', id: cue.id, kind: 'cue'});
  }
  R.resolve(game, events);
}

const assignment = R.createGame({mode: 'pool', players: 2});
play(assignment, {hit: 1, pocket: [1]});
assert.deepEqual(assignment.poolGroups, ['solids', 'stripes']);
assert.equal(assignment.turn, 0, 'legal own pocket keeps the table');
assert.equal(assignment.phase, 'aiming');
assert.deepEqual(assignment.scores, [1, 0]);
play(assignment, {hit: 2});
assert.equal(assignment.turn, 1, 'miss passes the turn');
play(assignment, {hit: 2});
assert.equal(assignment.turn, 0, 'hitting the opponent group first is a foul');
assert.equal(assignment.poolFoul, 'wrong-first-hit');

const scratch = R.createGame({mode: 'pool', players: 2});
play(scratch, {hit: 9, scratch: true});
const respottedCue = scratch.objects.find(object => object.kind === 'cue');
assert.equal(scratch.turn, 1);
assert.equal(respottedCue.active, true, 'cue ball respots after a scratch');
assert.equal(respottedCue.team, 1, 'cue belongs to the incoming turn for UI/AI');
assert.ok(respottedCue.x > scratch.board.playfield.x && respottedCue.x < scratch.board.playfield.x + scratch.board.playfield.w);
assert.ok(respottedCue.y > scratch.board.playfield.y && respottedCue.y < scratch.board.playfield.y + scratch.board.playfield.h);

const earlyEight = R.createGame({mode: 'pool', players: 2});
play(earlyEight, {hit: 8, pocket: [8]});
assert.equal(earlyEight.phase, 'finished');
assert.equal(earlyEight.winner, 1, 'pocketing 8 before clearing a group loses');

const legalEight = R.createGame({mode: 'pool', players: 2});
legalEight.poolGroups = ['solids', 'stripes'];
for (let number = 1; number <= 7; number++) ball(legalEight, number).active = false;
play(legalEight, {hit: 8, pocket: [8]});
assert.equal(legalEight.phase, 'finished');
assert.equal(legalEight.winner, 0, 'clear group then pocket 8 to win');

const scratchedEight = R.createGame({mode: 'pool', players: 2});
scratchedEight.poolGroups = ['solids', 'stripes'];
for (let number = 1; number <= 7; number++) ball(scratchedEight, number).active = false;
play(scratchedEight, {hit: 8, pocket: [8], scratch: true});
assert.equal(scratchedEight.winner, 1, 'scratching while pocketing 8 loses');

console.log('ttak pool 8-ball rules tests passed');
