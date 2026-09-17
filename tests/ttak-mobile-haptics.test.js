const assert = require('node:assert/strict');
const H = require('../games/ttak-club/v1.0.3/shared/haptics');

function environment({mobile=true, coarse=true, touch=5}={}) {
  const calls=[];
  let time=1000;
  const env={
    navigator:{
      userAgent:mobile?'Mozilla/5.0 (Linux; Android 14; Pixel 8)':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints:touch,
      vibrate:pattern=>{calls.push(pattern);return true;}
    },
    matchMedia:()=>({matches:coarse}),
    now:()=>time
  };
  return {env,calls,advance:ms=>time+=ms};
}

const mobile=environment();
const h=H.create(mobile.env);
assert.equal(h.enabled,true);
assert.equal(h.trigger('impact',100),false,'weak incidental collisions stay quiet');
assert.equal(h.trigger('impact',500),true);
assert.deepEqual(mobile.calls.at(-1),8);
assert.equal(h.trigger('impact',700),false,'impact vibration is rate limited');
mobile.advance(130);
assert.equal(h.trigger('impact',700),true);
assert.equal(h.trigger('out'),true);
assert.deepEqual(mobile.calls.at(-1),[35,25,55]);
assert.equal(h.trigger('line'),true);
assert.deepEqual(mobile.calls.at(-1),[18,25,45]);
assert.equal(h.trigger('cup'),true);
assert.deepEqual(mobile.calls.at(-1),[20,30,20,30,65]);
assert.equal(h.trigger('goal'),false,'success patterns share a cooldown');
mobile.advance(260);
assert.equal(h.trigger('target'),true);

for (const options of [{mobile:false},{coarse:false},{touch:0}]) {
  const desktop=environment(options),disabled=H.create(desktop.env);
  assert.equal(disabled.enabled,false);
  assert.equal(disabled.trigger('out'),false);
  assert.deepEqual(desktop.calls,[]);
}
console.log(JSON.stringify({ok:true,patterns:mobile.calls.length}));
