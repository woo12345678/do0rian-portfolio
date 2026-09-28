const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');
const F = require('../games/ttak-club/v1.0.3/shared/feedback');

const pocketGame = R.createGame({mode: 'pool', players: 2});
const one = pocketGame.objects.find(object => object.number === 1);
Object.assign(one, {x: 62, y: 62, vx: -120, vy: -120});
const pocketEvents = P.step(pocketGame.objects, 1 / 60, pocketGame.board);
assert.equal(one.active, false, 'numbered ball disappears into a pocket');
const pocketEvent = pocketEvents.find(event => event.type === 'pocket' && event.number === 1 && event.id === one.id);
assert.ok(pocketEvent);
const expectedPocket = pocketGame.board.pockets.reduce((best, pocket) => Math.hypot(one.x-pocket.x, one.y-pocket.y) < Math.hypot(one.x-best.x, one.y-best.y) ? pocket : best);
assert.deepEqual({x: pocketEvent.x, y: pocketEvent.y}, {x: expectedPocket.x, y: expectedPocket.y}, 'physical pocket center reaches audio layer');
assert.ok(F.audioCue('pool', pocketEvent).pan < -0.7, 'left pocket pans left end-to-end');

const hitGame = R.createGame({mode: 'pool', players: 2});
const cue = hitGame.objects.find(object => object.kind === 'cue');
const target = hitGame.objects.find(object => object.number === 9);
Object.assign(cue, {x: 500, y: 360, vx: 400, vy: 0});
Object.assign(target, {x: 534, y: 360, vx: 0, vy: 0});
const hitEvents = P.step(hitGame.objects, 1 / 120, hitGame.board);
assert.ok(hitEvents.some(event => event.type === 'cue-hit' && event.number === 9), 'cue-object first contact is observable');

console.log('ttak pool physics tests passed');
