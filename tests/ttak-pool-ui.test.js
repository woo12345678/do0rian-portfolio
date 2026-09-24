const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '../games/ttak-club/v1.0.3');
const app = fs.readFileSync(path.join(base, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(base, 'js/guide-locales.js'), 'utf8'), context);

assert.match(app, /pool:\{name:'포켓볼'/, 'Korean mode card names Pool');
assert.match(app, /pool:\{name:'8-Ball Pool'/, 'English mode card names Pool');
assert.match(app, /modeNames:\{[^}]*pool:'포켓볼'/, 'Korean quick guide includes Pool');
assert.match(app, /modeNames:\{[^}]*pool:'8-Ball Pool'/, 'English quick guide includes Pool');
assert.match(app, /game\.mode==='pool'/, 'Pool has mode-specific UI/gameplay wiring');
assert.match(app, /game\.poolFoul==='early-eight'/, 'Pool result explains an early 8-ball loss');
assert.match(app, /game\.poolFoul==='scratch-eight'/, 'Pool result explains an 8-ball scratch loss');
assert.match(html, /id="amountWrap"/, 'generic amount control can be hidden for Pool');
assert.match(app, /여덟 가지 손맛/);
assert.match(app, /EIGHT TABLE TALES/);

for (const [locale, copy] of Object.entries(context.window.TTAK_GUIDE_LOCALES)) {
  assert.ok(copy.modeNames.pool, `${locale} Pool mode name`);
  assert.equal(copy.modes.pool.steps.length, 3, `${locale} Pool has three guide steps`);
  assert.ok(copy.modes.pool.steps.every(Boolean), `${locale} Pool guide is complete`);
  assert.match(copy.modes.chain.steps.join(' '), /1→2→3/, `${locale} Trick Shot explains 1→2→3`);
  assert.doesNotMatch(copy.modes.chain.steps.join(' '), /4→5/, `${locale} Trick Shot no longer promises targets 4 and 5`);
}

console.log('ttak pool UI and guide tests passed');
