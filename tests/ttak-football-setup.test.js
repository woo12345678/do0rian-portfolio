const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'games', 'ttak-club', 'v1.0.3');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');

assert.match(html, /id="footballDiscsWrap"[^>]*class="[^"]*hidden[^"]*"/, 'football stone selector starts hidden');
assert.match(html, /id="footballDiscs"/, 'football stone selector exists');
assert.match(html, /<option value="3"[^>]*>3<\/option>/, 'three-stone option exists');
assert.match(html, /<option value="5"[^>]*>5<\/option>/, 'five-stone option exists');
assert.match(app, /footballDiscsWrap[^\n]+mode==='football'/, 'selector visibility follows football mode');
assert.match(app, /mode==='football'\?\{targetScore:[^}]+discs:\+\$\('#footballDiscs'\)\.value\}/,
  'football settings preserve target score and pass selected stones');
assert.match(app, /footballDiscs:game\.settings\?\.discs/, 'runtime state exposes selected football stones');
assert.match(app, /pitchWidth:game\.board\.playfield\?\.w/, 'runtime state exposes pitch width for browser QA');

console.log(JSON.stringify({ok: true}));
