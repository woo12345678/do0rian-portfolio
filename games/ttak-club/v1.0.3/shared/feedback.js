(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.TtakFeedback=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function turnNotice({previousTurn,nextTurn,phase,ai=false}){
    if(phase==='finished')return null;
    const base={from:previousTurn,to:nextTurn,ai:!!ai};
    if(phase==='counter')return{kind:'counter',...base};
    return{kind:previousTurn===nextTurn?'continue':'change',...base};
  }
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function audioCue(mode,event){
    if(!event)return null;
    const x=Number.isFinite(event.x)?event.x:600,pan=clamp(x/600-1,-.85,.85);
    if(mode==='pool'&&event.type==='impact'){
      if((event.strength||0)<60)return null;
      const intensity=clamp(((event.strength||0)-60)/840,.08,1);
      return{type:'pool-impact',intensity,pan,pitch:Math.round(650+850*intensity)};
    }
    if(mode==='pool'&&event.type==='pocket')return{type:'pool-pocket',intensity:1,pan};
    if(mode==='football'&&event.type==='goal')return{type:'football-goal',intensity:1,pan:0};
    return null;
  }
  function audioEventKey(mode,event){
    if(!event?.id)return null;
    if(mode==='pool'&&event.type==='pocket')return`pool:pocket:${event.id}`;
    if(mode==='football'&&event.type==='goal')return`football:goal:${event.id}`;
    return null;
  }
  return{turnNotice,audioCue,audioEventKey};
});
