(function(root,factory){const api=factory(typeof require==='function'?require('./rules'):root.TtakRules,typeof require==='function'?require('./physics'):root.TtakPhysics);if(typeof module==='object'&&module.exports)module.exports=api;else root.TtakAI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R,P){
  'use strict';
  const PROFILES={
    easy:{jitter:.34,classicPower:760,footballPower:820,impactPower:800},
    normal:{jitter:.12,classicPower:1050,footballPower:1100,impactPower:1050},
    hard:{jitter:.035,classicPower:1325,footballPower:1400,impactPower:1375}
  };
  function rng(seed=Date.now()){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  function segmentBlocked(g,a,b,ignore){
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy||1;
    return g.objects.some(o=>o.active&&o!==a&&o!==b&&o!==ignore&&(()=>{
      const t=((o.x-a.x)*dx+(o.y-a.y)*dy)/length2;
      if(t<=.04||t>=.96)return false;
      return Math.hypot(o.x-(a.x+dx*t),o.y-(a.y+dy*t))<a.radius+o.radius+4;
    })());
  }
  function shotToward(d,target,power,profile,random){
    let angle=Math.atan2(target.y-d.y,target.x-d.x)+(random()-.5)*profile.jitter;
    power=Math.min(P.MAX_SPEED,power);
    return{id:d.id,force:{x:Math.cos(angle)*power,y:Math.sin(angle)*power}};
  }
  function classicPlan(g,legal){
    let best=null;
    for(const disc of legal)for(const foe of g.objects.filter(o=>o.active&&o.team!==disc.team&&o.kind==='disc')){
      const attack=disc.team===0?-1:1;
      const forward=(foe.y-disc.y)*attack;
      if(forward<=0)continue;
      const lateral=Math.abs(foe.x-disc.x);
      const edgePressure=disc.team===0?g.board.height-foe.y:foe.y;
      const blocked=segmentBlocked(g,disc,foe);
      const quality=forward*1.5-lateral*2-distance(disc,foe)*.12+edgePressure*.3-(blocked?2000:0);
      if(!best||quality>best.quality)best={disc,target:foe,quality};
    }
    return best;
  }
  function footballPlan(g,legal){
    const ball=g.objects.find(o=>o.active&&o.kind==='ball');if(!ball)return null;
    let best=null;
    for(const disc of legal){
      const attack=disc.team===0?-1:1;
      const behind=(ball.y-disc.y)*attack;
      const lateral=Math.abs(ball.x-disc.x);
      const quality=(behind>0?1200:-1200)+behind-lateral*3-distance(disc,ball)*.15;
      if(!best||quality>best.quality)best={disc,target:ball,quality};
    }
    return best;
  }
  function lineShot(g,disc,profile,random){
    const safety=24,target={x:disc.x,y:g.board.targetLine+safety};
    const travel=Math.max(0,disc.y-target.y),friction=g.board.friction||1.65,dt=1/120;
    const travelPerSpeed=dt/(1-Math.exp(-friction*dt));
    const power=travel/travelPerSpeed+P.REST_SPEED;
    return shotToward(disc,target,power,{...profile,jitter:profile.jitter*.12},random);
  }
  function segmentDistance(a,b,p){
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy||1;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length2));
    return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));
  }
  function golfShot(g,disc,profile,random){
    const cup=g.board.cup,rocks=(g.board.rocks||[]).filter(rock=>segmentDistance(disc,cup,rock)<rock.r+disc.radius+12);
    let target=cup;
    if(rocks.length){
      const rock=rocks.sort((a,b)=>distance(disc,a)-distance(disc,b))[0];
      const dx=cup.x-disc.x,dy=cup.y-disc.y,length=Math.hypot(dx,dy)||1;
      const px=-dy/length,py=dx/length,clearance=rock.r+disc.radius+34;
      const options=[-1,1].map(side=>({x:rock.x+px*clearance*side,y:rock.y+py*clearance*side}));
      target=options.filter(p=>p.x>disc.radius&&p.x<g.board.width-disc.radius&&p.y>disc.radius&&p.y<g.board.height-disc.radius)
        .sort((a,b)=>(distance(disc,a)+distance(a,cup))-(distance(disc,b)+distance(b,cup)))[0]||options[0];
    }
    const power=Math.min(1375,Math.max(780,distance(disc,target)*1.65));
    return shotToward(disc,target,power,{...profile,jitter:profile.jitter*.45},random);
  }
  function coopPlan(g,legal){
    let best=null;
    for(const target of g.objects.filter(o=>o.active&&o.kind==='goblin'))for(const disc of legal){
      const quality=(target.heavy?900:0)-distance(disc,target);
      if(!best||quality>best.quality)best={disc,target,quality};
    }
    return best;
  }
  function safetyMargin(g,o){return Math.min(o.x-o.radius-g.board.inset,g.board.width-g.board.inset-o.radius-o.x,o.y-o.radius-g.board.inset,g.board.height-g.board.inset-o.radius-o.y);}
  function royalPlan(g,legal){
    const center={x:g.board.width/2,y:g.board.height/2};
    const endangered=legal.filter(o=>safetyMargin(g,o)<35).sort((a,b)=>safetyMargin(g,a)-safetyMargin(g,b))[0];
    const foes=g.objects.filter(o=>o.active&&o.kind==='disc'&&!legal.includes(o));
    if(endangered){
      const inward={x:center.x-endangered.x,y:center.y-endangered.y};
      const clean=foes.filter(foe=>(foe.x-endangered.x)*inward.x+(foe.y-endangered.y)*inward.y>0&&distance(endangered,foe)<300)
        .sort((a,b)=>distance(endangered,a)-distance(endangered,b))[0];
      return{disc:endangered,target:clean||center};
    }
    let best=null;
    for(const disc of legal)for(const foe of foes){const quality=-distance(disc,foe)+safetyMargin(g,disc)*.2;if(!best||quality>best.quality)best={disc,target:foe,quality};}
    return best||{disc:legal[0],target:center};
  }
  function objective(g,disc){
    const foes=g.objects.filter(o=>o.active&&o.team!==disc.team&&o.kind!=='target'&&o.kind!=='ball');
    if(g.mode==='football')return g.objects.find(o=>o.kind==='ball');
    if(g.mode==='line')return{x:disc.x,y:g.board.targetLine+25};
    if(g.mode==='golf')return g.board.cup;
    if(g.mode==='coop')return g.objects.filter(o=>o.active&&o.kind==='goblin').sort((a,b)=>Number(b.heavy)-Number(a.heavy))[0];
    if(g.mode==='chain')return g.objects.find(o=>o.kind==='target'&&o.number===g.nextTarget);
    if(g.mode==='royal')return foes.sort((a,b)=>distance(disc,a)-distance(disc,b))[0];
    return{x:600,y:360};
  }
  function chooseShot(g,difficulty='normal',seed){
    const legal=R.eligibleObjects(g);if(!legal.length)return null;
    const profile=PROFILES[difficulty]||PROFILES.normal,random=rng(seed);
    if(g.mode==='classic'){
      const plan=classicPlan(g,legal);
      if(plan)return shotToward(plan.disc,plan.target,profile.classicPower,profile,random);
    }
    if(g.mode==='football'){
      const plan=footballPlan(g,legal);
      if(plan)return shotToward(plan.disc,plan.target,profile.footballPower,profile,random);
    }
    if(g.mode==='line')return lineShot(g,legal[0],profile,random);
    if(g.mode==='golf')return golfShot(g,legal[0],profile,random);
    if(g.mode==='coop'){
      const plan=coopPlan(g,legal);
      if(plan)return shotToward(plan.disc,plan.target,profile.impactPower,profile,random);
    }
    if(g.mode==='royal'){
      const plan=royalPlan(g,legal);
      return shotToward(plan.disc,plan.target,profile.impactPower,profile,random);
    }
    if(g.mode==='chain'){
      const target=g.objects.find(o=>o.active&&o.kind==='target'&&o.number===g.nextTarget);
      if(target){const disc=legal.slice().sort((a,b)=>distance(a,target)-distance(b,target))[0];return shotToward(disc,target,profile.impactPower,profile,random);}
    }
    const disc=legal[0],target=objective(g,disc)||{x:600,y:360};
    return shotToward(disc,target,Math.max(350,Math.min(1400,distance(disc,target)*2.25)),profile,random);
  }
  function chooseGoblinShot(g,seed){
    const goblins=g.objects.filter(o=>o.active&&o.kind==='goblin');
    const victims=g.objects.filter(o=>o.active&&o.kind==='disc');
    if(!goblins.length||!victims.length)return null;
    let best=null;
    for(const goblin of goblins)for(const victim of victims){
      const blocked=segmentBlocked(g,goblin,victim);
      const quality=(blocked?1e6:0)+distance(goblin,victim)-(goblin.heavy?25:0);
      if(!best||quality<best.quality)best={goblin,victim,quality};
    }
    const power=Math.min(P.MAX_SPEED,best.goblin.heavy?1450:1200);
    const dx=best.victim.x-best.goblin.x,dy=best.victim.y-best.goblin.y,length=Math.hypot(dx,dy)||1;
    return{id:best.goblin.id,target:best.victim.id,force:{x:dx/length*power,y:dy/length*power},seed};
  }
  return{chooseShot,chooseGoblinShot};
});
