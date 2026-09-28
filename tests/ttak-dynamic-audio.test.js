const assert = require('node:assert/strict');
const F = require('../games/ttak-club/v1.0.3/shared/feedback');

assert.equal(F.audioCue('pool', {type: 'impact', strength: 30, x: 600}), null, 'tiny contacts stay quiet');
const soft = F.audioCue('pool', {type: 'impact', strength: 180, x: 240});
const hard = F.audioCue('pool', {type: 'impact', strength: 900, x: 960});
assert.equal(soft.type, 'pool-impact');
assert.equal(hard.type, 'pool-impact');
assert.ok(hard.intensity > soft.intensity, 'harder collisions sound louder');
assert.ok(hard.pitch > soft.pitch, 'harder collisions sound brighter');
assert.ok(soft.pan < 0 && hard.pan > 0, 'sound follows collision position');
assert.deepEqual(F.audioCue('pool', {type: 'pocket', x: 150}), {type: 'pool-pocket', intensity: 1, pan: -0.75});
assert.deepEqual(F.audioCue('football', {type: 'goal', side: 'top'}), {type: 'football-goal', intensity: 1, pan: 0});
assert.equal(F.audioCue('classic', {type: 'goal'}), null, 'goal cue is football-only');
assert.equal(F.audioEventKey('pool', {type: 'impact', id: 'p1'}), null, 'ball impacts stay repeatable');
assert.equal(F.audioEventKey('pool', {type: 'pocket', id: 'p1'}), 'pool:pocket:p1');
assert.equal(F.audioEventKey('football', {type: 'goal', id: 'ball'}), 'football:goal:ball');
console.log('ttak dynamic audio mapping tests passed');
