const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'games', 'ttak-club', 'v1.0.3');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

assert.match(html, /id="footballDiscsWrap"[^>]*class="[^"]*hidden[^"]*"/, 'football stone selector starts hidden');
assert.match(html, /id="footballDiscs"/, 'football stone selector exists');
assert.match(html, /id="footballArenaWrap"[^>]*class="[^"]*hidden[^"]*"/, 'football arena selector starts hidden');
assert.match(html, /id="footballArena"/, 'football arena selector exists');
for(const arena of ['classic','spring','fortress','random'])assert.match(html,new RegExp(`<option value="${arena}"`),`${arena} arena option exists`);
assert.match(html, /<option value="3"[^>]*>3<\/option>/, 'three-stone option exists');
assert.match(html, /<option value="5"[^>]*>5<\/option>/, 'five-stone option exists');
assert.match(app, /footballDiscsWrap[^\n]+mode==='football'/, 'selector visibility follows football mode');
assert.match(app, /footballArenaWrap[^\n]+mode!=='football'/, 'arena selector visibility follows football mode');
assert.match(app, /footballArena:\$\('#footballArena'\)\.value/, 'selected arena is passed to football rules');
assert.match(app, /footballArena:game\.settings\?\.footballArena/, 'actual arena is exposed for browser QA');
assert.match(app, /b\.bumpers\|\|\[\]/, 'football renderer draws spring bumpers from board data');
assert.match(app, /b\.obstacles\|\|\[\]/, 'football renderer draws fortress walls from board data');
assert.match(app, /mode==='football'\?\{targetScore:[^}]+discs:\+\$\('#footballDiscs'\)\.value,footballArena:/,
  'football settings preserve target score, stones, and arena');
assert.match(app, /footballDiscs:game\.settings\?\.discs/, 'runtime state exposes selected football stones');
assert.match(app, /pitchWidth:game\.board\.playfield\?\.w/, 'runtime state exposes pitch width for browser QA');

console.log(JSON.stringify({ok: true}));
