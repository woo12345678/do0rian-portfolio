const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('games/ttak-club/v1.0.3/js/app.js', 'utf8');
assert.match(app, /팀당 돌 3개 또는 5개를 고르세요\. 5개를 고르면 경기장도 넓어집니다\./,
  'Korean football guide explains both stone counts and pitch growth');
assert.match(app, /Choose 3 or 5 stones per team\. The pitch expands for 5 stones\./,
  'English football guide explains both stone counts and pitch growth');

const context = {window: {}};
vm.runInNewContext(fs.readFileSync('games/ttak-club/v1.0.3/js/guide-locales.js', 'utf8'), context);
for (const [locale, copy] of Object.entries(context.window.TTAK_GUIDE_LOCALES)) {
  const text = copy.modes.football.steps.join(' ');
  assert.match(text, /3/, `${locale} football guide mentions 3 stones`);
  assert.match(text, /5/, `${locale} football guide mentions 5 stones`);
}

console.log(JSON.stringify({ok: true, locales: Object.keys(context.window.TTAK_GUIDE_LOCALES).length + 2}));
