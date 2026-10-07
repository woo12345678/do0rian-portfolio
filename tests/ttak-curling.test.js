const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');

assert.ok(R.MODES.includes('curling'), 'curling is a selectable mode');

const defaults = R.createGame({mode:'curling', players:5, settings:{}});
assert.equal(defaults.players, 2, 'curling is always two teams');
assert.equal(defaults.settings.stonesPerTeam, 4, 'quick default uses four stones per team');
assert.equal(defaults.settings.ends, 2, 'quick default uses two ends');
assert.equal(defaults.board.surface, 'ice');
assert.equal(defaults.board.friction, 1.65, 'curling uses the normal tabletop deceleration');
assert.equal(defaults.board.orientation, 'horizontal', 'curling deliveries travel left to right');
assert.ok(defaults.board.playfield.w > defaults.board.playfield.h * 2, 'the sheet is visibly horizontal');
assert.deepEqual(defaults.board.house.center, {x:1020,y:360});
assert.deepEqual(defaults.board.geometry.hack, {x:230,y:360});
assert.ok(defaults.board.house.center.x-defaults.board.geometry.hack.x >= 750, 'horizontal sheet has a longer delivery distance');
assert.equal(R.eligibleObjects(defaults).length, 1, 'only the current delivery stone is playable');

const humanDraw = R.createGame({mode:'curling', settings:{stonesPerTeam:1,ends:1}});
const humanStone = R.eligibleObjects(humanDraw)[0];
assert.ok(R.markShot(humanDraw, humanStone.id));
P.applyShot(humanStone, {x:180*7.2,y:0});
let humanSteps=0;
for(;humanSteps<600&&!P.allResting(humanDraw.objects);humanSteps++) P.step(humanDraw.objects,1/120,humanDraw.board);
assert.ok(P.allResting(humanDraw.objects), 'normal-friction delivery stops within five seconds');
assert.ok(Math.hypot(humanStone.x-humanDraw.board.house.center.x,humanStone.y-humanDraw.board.house.center.y)<=humanDraw.board.house.radius+humanStone.radius, 'a practical 180px pull reaches the distant house');

const long = R.createGame({mode:'curling', players:2, settings:{stonesPerTeam:8, ends:10}});
assert.equal(long.settings.stonesPerTeam, 8);
assert.equal(long.settings.ends, 10);
const clamped = R.createGame({mode:'curling', settings:{stonesPerTeam:99, ends:99}});
assert.equal(clamped.settings.stonesPerTeam, 8);
assert.equal(clamped.settings.ends, 10);

const fractional = R.createGame({mode:'curling', settings:{stonesPerTeam:1.9, ends:2.9}});
assert.equal(fractional.settings.stonesPerTeam, 1, 'fractional stone counts truncate to a whole delivery count');
assert.equal(fractional.settings.ends, 2, 'fractional end counts truncate to whole ends');
const zeroAndNegative = R.createGame({mode:'curling', settings:{stonesPerTeam:0, ends:-4}});
assert.equal(zeroAndNegative.settings.stonesPerTeam, 1, 'zero stone count clamps to one');
assert.equal(zeroAndNegative.settings.ends, 1, 'negative end count clamps to one');
const nonFinite = R.createGame({mode:'curling', settings:{stonesPerTeam:Infinity, ends:NaN}});
assert.equal(nonFinite.settings.stonesPerTeam, 4, 'non-finite stone count uses the light default');
assert.equal(nonFinite.settings.ends, 2, 'non-finite end count uses the light default');

const shortStone = R.createGame({mode:'curling', settings:{stonesPerTeam:2, ends:1}});
const shortId = shortStone.currentStoneId;
assert.ok(R.markShot(shortStone, shortId));
shortStone.objects.find(object => object.id === shortId).x = 500;
R.resolve(shortStone, []);
assert.equal(shortStone.objects.find(object => object.id === shortId).active, false, 'stone that never fully crosses the hog line is removed');

const touchedStone = R.createGame({mode:'curling', settings:{stonesPerTeam:2, ends:1}});
const touchedId = touchedStone.currentStoneId;
assert.ok(R.markShot(touchedStone, touchedId));
touchedStone.objects.find(object => object.id === touchedId).x = 500;
R.resolve(touchedStone, [{type:'impact', strength:100}]);
assert.equal(touchedStone.objects.find(object => object.id === touchedId).active, true, 'a delivered stone that contacted another stone is exempt from the hog-line removal');

const backStone = R.createGame({mode:'curling', settings:{stonesPerTeam:2, ends:1}});
const backId = backStone.currentStoneId;
assert.ok(R.markShot(backStone, backId));
backStone.objects.find(object => object.id === backId).x = 1170;
R.resolve(backStone, []);
assert.equal(backStone.objects.find(object => object.id === backId).active, false, 'stone fully beyond the back line is removed');

const house = {center:{x:1020,y:360}, radius:100};
const score = R.curlingScore([
  {active:true,kind:'disc',team:0,x:1040,y:360,radius:25},
  {active:true,kind:'disc',team:0,x:1090,y:360,radius:25},
  {active:true,kind:'disc',team:1,x:1070,y:360,radius:25},
  {active:true,kind:'disc',team:1,x:700,y:360,radius:25}
], house);
assert.deepEqual(score, {team:0,points:1}, 'only stones closer than the opponent nearest stone score');
assert.deepEqual(R.curlingScore([
  {active:true,kind:'disc',team:0,x:1040,y:360,radius:25},
  {active:true,kind:'disc',team:1,x:1000,y:360,radius:25}
], house), {team:null,points:0}, 'an exact measurement tie is a blank end');

function deliver(game, x, y) {
  const stone = R.eligibleObjects(game)[0];
  assert.ok(stone, 'delivery stone exists');
  assert.ok(R.markShot(game, stone.id));
  Object.assign(stone, {x,y,vx:0,vy:0,active:true});
  R.resolve(game, []);
}

const oneEnd = R.createGame({mode:'curling', settings:{stonesPerTeam:1, ends:1}});
assert.equal(oneEnd.turn, 0);
deliver(oneEnd, 1040, 360);
assert.equal(oneEnd.turn, 1, 'teams alternate deliveries');
assert.equal(oneEnd.objects.length, 2, 'delivered stones remain in play while a new stone appears');
deliver(oneEnd, 1085, 360);
assert.equal(oneEnd.phase, 'finished');
assert.deepEqual(oneEnd.scores, [1,0]);
assert.equal(oneEnd.winner, 0);

const match = R.createGame({mode:'curling', settings:{stonesPerTeam:1, ends:2}});
deliver(match, 1040,360);
deliver(match, 1100,360);
assert.deepEqual(match.endHistory, [{end:1,team:0,points:1,scores:[1,0]}], 'completed-end history records the winner, points, and cumulative score');
assert.equal(match.end, 2);
assert.equal(match.turn, 0, 'the scoring team throws first next end, giving the opponent hammer');
assert.equal(match.hammer, 1);
deliver(match, 1110,360);
deliver(match, 1040,360);
assert.equal(match.end, 3, 'a tied scheduled match creates an extra end');
assert.equal(match.extraEnds, 1);
assert.equal(match.phase, 'aiming');

console.log('ttak curling rules tests passed');
