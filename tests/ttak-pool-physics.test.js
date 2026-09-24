const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');

const pocketGame = R.createGame({mode: 'pool', players: 2});
const one = pocketGame.objects.find(object => object.number === 1);
Object.assign(one, {x: 600, y: 62, vx: 0, vy: -120});
const pocketEvents = P.step(pocketGame.objects, 1 / 60, pocketGame.board);
assert.equal(one.active, false, 'numbered ball disappears into a pocket');
assert.ok(pocketEvents.some(event => event.type === 'pocket' && event.number === 1 && event.id === one.id));

const hitGame = R.createGame({mode: 'pool', players: 2});
const cue = hitGame.objects.find(object => object.kind === 'cue');
const target = hitGame.objects.find(object => object.number === 9);
Object.assign(cue, {x: 500, y: 360, vx: 400, vy: 0});
Object.assign(target, {x: 534, y: 360, vx: 0, vy: 0});
const hitEvents = P.step(hitGame.objects, 1 / 120, hitGame.board);
assert.ok(hitEvents.some(event => event.type === 'cue-hit' && event.number === 9), 'cue-object first contact is observable');

console.log('ttak pool physics tests passed');
