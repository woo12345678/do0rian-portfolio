const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
function rng(seed){let state=seed>>>0;return()=>((state=(state*1664525+0x3c6ef35f)>>>0)/4294967296);}
for(let seed=1;seed<=200;seed++){
  const game=R.createGame({mode:'chain',players:5,rng:rng(seed)});
  const targets=game.objects.filter(object=>object.kind==='target');
  const discs=game.objects.filter(object=>object.kind==='disc');
  assert.equal(targets.length,5);
  for(const target of targets){
    assert.ok(target.x-target.radius>=0&&target.x+target.radius<=1200,`seed ${seed}: target x bounds`);
    assert.ok(target.y-target.radius>=0&&target.y+target.radius<=720,`seed ${seed}: target y bounds`);
    for(const disc of discs)assert.ok(Math.hypot(target.x-disc.x,target.y-disc.y)>=target.radius+disc.radius+4,`seed ${seed}: target/disc overlap`);
  }
  for(let a=0;a<targets.length;a++)for(let b=a+1;b<targets.length;b++)assert.ok(Math.hypot(targets[a].x-targets[b].x,targets[a].y-targets[b].y)>=targets[a].radius+targets[b].radius+4,`seed ${seed}: targets overlap`);
}

const failSafe=R.createGame({mode:'chain',players:1,settings:{resetTurns:1},rng:()=>0.5});
const movingDisc=failSafe.objects.find(object=>object.kind==='disc');
Object.assign(movingDisc,{x:600,y:360});
assert.equal(R.markShot(failSafe,movingDisc.id),true);
R.resolve(failSafe,[]);
assert.equal(failSafe.resetEvery,1);
for(const target of failSafe.objects.filter(object=>object.kind==='target'))assert.ok(Math.hypot(target.x-movingDisc.x,target.y-movingDisc.y)>=target.radius+movingDisc.radius+4,'constant RNG reset must use collision-free fallback');
console.log(JSON.stringify({ok:true,layouts:200}));
