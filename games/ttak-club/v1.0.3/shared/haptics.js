(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TtakHaptics=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MOBILE=/Android|iPhone|iPad|iPod|Mobile/i;
  const SUCCESS=new Set(['cup','goal','target','victory']);
  const PATTERNS={impact:8,out:[35,25,55],line:[18,25,45],success:[20,30,20,30,65]};
  function create(env=typeof globalThis!=='undefined'?globalThis:{}){
    const nav=env.navigator||{},coarse=typeof env.matchMedia==='function'&&env.matchMedia('(pointer: coarse)').matches;
    const enabled=typeof nav.vibrate==='function'&&(nav.maxTouchPoints||0)>0&&coarse&&MOBILE.test(nav.userAgent||'');
    const clock=typeof env.now==='function'?env.now:()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
    let lastImpact=-Infinity,lastSuccess=-Infinity,lastOut=-Infinity;
    function vibrate(pattern){if(!enabled)return false;try{return nav.vibrate(pattern)!==false;}catch{return false;}}
    function trigger(type,strength=0){
      if(!enabled)return false;
      const now=clock();
      if(type==='impact'){
        if(strength<180||now-lastImpact<120)return false;
        lastImpact=now;return vibrate(PATTERNS.impact);
      }
      if(type==='out'){
        if(now-lastOut<90)return false;
        lastOut=now;return vibrate(PATTERNS.out);
      }
      if(type==='line')return vibrate(PATTERNS.line);
      if(SUCCESS.has(type)){
        if(now-lastSuccess<250)return false;
        lastSuccess=now;return vibrate(PATTERNS.success);
      }
      return false;
    }
    return Object.freeze({enabled,trigger});
  }
  return Object.freeze({create,PATTERNS});
});
