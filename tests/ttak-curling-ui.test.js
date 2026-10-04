const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const base = 'games/ttak-club/v1.0.3';
const app = fs.readFileSync(`${base}/js/app.js`, 'utf8');
const html = fs.readFileSync(`${base}/index.html`, 'utf8');
const sw = fs.readFileSync(`${base}/sw.js`, 'utf8');

assert.match(sw, /ttak-static-v1\.0\.3-curling-16/, 'Curling update invalidates the offline cache');
assert.match(app, /curling:\{name:'라이트 컬링'/, 'Korean mode card exists');
assert.match(app, /curling:\{name:'Light Curling'/, 'English mode card exists');
assert.match(app, /아홉 가지 손맛/);
assert.match(app, /NINE TABLE TALES/);
assert.match(html, /id="curlingStonesWrap"/);
assert.match(html, /id="curlingStones"[^>]*min="1"[^>]*max="8"[^>]*value="4"/);
assert.match(html, /id="curlingEndsWrap"/);
assert.match(html, /id="curlingEnds"[^>]*min="1"[^>]*max="10"[^>]*value="2"/);
assert.match(app, /mode==='curling'/, 'setup has a Curling-specific branch');
assert.match(app, /stonesPerTeam:\+\$\('#curlingStones'\)\.value/);
assert.match(app, /ends:\+\$\('#curlingEnds'\)\.value/);
assert.match(app, /game\.mode==='curling'/, 'canvas renders a Curling sheet');
assert.match(app, /game\.board\.house/, 'canvas uses rules-owned house geometry');
assert.match(app, /game\.end.*game\.settings\.ends/, 'HUD exposes end progress');
assert.match(app, /game\.hammer/, 'HUD exposes the hammer team');
assert.match(app, /stonesPerTeam:game\.settings\?\.stonesPerTeam/, 'QA state exposes configured stones');
assert.match(app, /ends:game\.settings\?\.ends/, 'QA state exposes configured ends');

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(`${base}/js/guide-locales.js`, 'utf8'), context);
for (const [locale, copy] of Object.entries(context.window.TTAK_GUIDE_LOCALES)) {
  assert.ok(copy.modeNames.curling, `${locale}: Curling name`);
  assert.equal(copy.modes.curling.steps.length, 3, `${locale}: Curling has three guide steps`);
  assert.ok(copy.modes.curling.tip, `${locale}: Curling tip`);
}

console.log('ttak curling UI tests passed');
