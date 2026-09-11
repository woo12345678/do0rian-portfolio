(function (root, factory) {
  const api = factory(typeof require === 'function' ? require('./physics') : root.TtakPhysics);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.TtakRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (P) {
  'use strict';
  const W = 1200, H = 720;
  const FORMATIONS = Object.freeze({
    standard: Object.freeze({ label: '기본진' }),
    wedge: Object.freeze({ label: '쐐기진' }),
    wall: Object.freeze({ label: '장벽진' }),
    wings: Object.freeze({ label: '양날개' })
  });
  const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value;};
  const FIELD_GEOMETRY=deepFreeze({
    classic:{grid:{lines:19,left:294,top:54,spacing:34},stars:[3,9,15].flatMap(row=>[3,9,15].map(column=>({column,row}))),frame:{x:270,y:30,w:660,h:660}},
    football:{orientation:'vertical',goals:{x1:500,x2:700},touchline:{x:310,y:20,w:580,h:680},halfway:{y:360},center:{x:600,y:360,radius:72},penaltyBoxes:[{x:430,y:20,w:340,h:125},{x:430,y:575,w:340,h:125}]}
  });
  const HOLES = [
    { name: '소나무 굽이', tee: {x:150,y:560}, cup:{x:1020,y:150,r:30}, rocks:[{x:570,y:340,r:72}], rough:[{x:650,y:80,w:220,h:210}] },
    { name: '두루미 길', tee: {x:130,y:180}, cup:{x:1040,y:560,r:30}, rocks:[{x:420,y:390,r:58},{x:780,y:330,r:65}], rough:[{x:480,y:500,w:300,h:120}] },
    { name: '달 항아리', tee: {x:170,y:360}, cup:{x:1030,y:360,r:30}, rocks:[{x:600,y:250,r:58},{x:600,y:470,r:58}], rough:[{x:510,y:300,w:180,h:120}] }
  ];
  const COURSE_DATA=[
    {fairway:[{x:105,y:610},{x:240,y:470},{x:430,y:430},{x:650,y:270},{x:1070,y:105},{x:1110,y:205},{x:720,y:350},{x:480,y:540},{x:170,y:650}],puttingGreen:{x:1020,y:150,rx:90,ry:58},bunkers:[{x:850,y:220,rx:78,ry:34}]},
    {fairway:[{x:85,y:130},{x:310,y:155},{x:520,y:270},{x:720,y:430},{x:1080,y:505},{x:1100,y:625},{x:780,y:585},{x:570,y:390},{x:270,y:260}],puttingGreen:{x:1040,y:560,rx:90,ry:58},bunkers:[{x:875,y:505,rx:82,ry:38},{x:300,y:235,rx:55,ry:28}]},
    {fairway:[{x:110,y:300},{x:360,y:275},{x:570,y:320},{x:810,y:260},{x:1090,y:305},{x:1090,y:420},{x:800,y:455},{x:560,y:400},{x:260,y:445},{x:110,y:410}],puttingGreen:{x:1030,y:360,rx:90,ry:58},bunkers:[{x:760,y:405,rx:72,ry:32},{x:930,y:285,rx:52,ry:25}]}
  ];
  HOLES.forEach((hole,index)=>Object.assign(hole,COURSE_DATA[index]));
  let serial = 0;
  const disc = (team,x,y,extra={}) => P.body({id:`d${serial++}`,team,x,y,radius:25,...extra});
  const grids = {
    standard: () => Array.from({length:20},(_,i)=>({x:420+(i%5)*90,y:480+Math.floor(i/5)*60})),
    wedge: () => { const out=[]; for(let row=0;row<6;row++) for(let col=0;col<=row;col++) out.push({x:600+(col-row/2)*62,y:410+row*50}); return out; },
    wall: () => Array.from({length:20},(_,i)=>({x:330+(i%10)*60,y:570+Math.floor(i/10)*70})),
    wings: () => Array.from({length:20},(_,i)=>{const side=i%2,slot=Math.floor(i/2);return{x:(side?750:330)+(slot%3)*60,y:500+Math.floor(slot/3)*60};})
  };
  function formationPoints(id='standard',count=5){
    const formation=Object.hasOwn(FORMATIONS,id)?id:'standard';
    return grids[formation]().slice(0,Math.max(1,Math.min(20,count))).map(point=>Object.freeze({...point}));
  }
  function classicPieces(count,formation){
    const bottom=formationPoints(formation,count),out=[];
    for(const point of bottom)out.push(disc(0,point.x,point.y));
    for(const point of bottom)out.push(disc(1,point.x,H-point.y));
    return out;
  }
  function rows(players, count, radius=25) {
    const out=[];
    for(let t=0;t<players;t++) for(let i=0;i<count;i++) {
      const left=t%2===0, band=Math.floor(t/2); out.push(disc(t,left?150+band*90:1050-band*90,190+i*(340/Math.max(1,count-1)),{radius}));
    } return out;
  }
  function verticalRows(players,count,radius=25){
    const out=[];
    for(let t=0;t<players;t++)for(let i=0;i<count;i++){
      const bottom=t%2===0,band=Math.floor(t/2);
      out.push(disc(t,480+i*(240/Math.max(1,count-1)),bottom?590-band*70:130+band*70,{radius}));
    }
    return out;
  }
  function createGame(opts={}) {
    serial=0; const mode=opts.mode||'classic', requestedPlayers=Math.max(1,Math.min(4,opts.players||2)), players=['classic','football','line'].includes(mode)?2:requestedPlayers, s=opts.settings||{};
    const settings={...s};
    if(mode==='classic')settings.formation=Object.hasOwn(FORMATIONS,s.formation)?s.formation:'standard';
    const g={mode,players,settings,phase:'aiming',turn:0,round:1,shot:0,winner:null,scores:Array(players).fill(0),objects:[],board:{width:W,height:H,walls:false,orientation:'vertical'},events:[]};
    if(mode==='classic'){g.board.geometry=FIELD_GEOMETRY.classic;g.board.playfield=FIELD_GEOMETRY.classic.frame;g.board.surface='baduk';g.objects=classicPieces(Math.max(1,Math.min(20,s.discs||5)),settings.formation);}
    if(mode==='football'){g.board.walls=true;g.board.geometry=FIELD_GEOMETRY.football;g.board.playfield=FIELD_GEOMETRY.football.touchline;g.board.goals={...FIELD_GEOMETRY.football.goals};g.board.surface='grass';g.objects=verticalRows(players,3,23);g.objects.push(P.body({id:'ball',kind:'ball',x:600,y:360,radius:20,mass:.65}));}
    if(mode==='line'){g.board={width:W,height:H,walls:true,openEdges:{top:true},orientation:'vertical',targetAxis:'y',targetLine:160};g.throws=1;g.attempts=Array.from({length:players},()=>[]);g.objects=Array.from({length:players},(_,t)=>disc(t,520+t*160,620));}
    if(mode==='golf'){g.board.walls=true;g.hole=0; setupHole(g);}
    if(mode==='coop'){g.players=players;g.turnBudget=12;g.wave=1;spawnCoop(g);}
    if(mode==='royal'){g.board.walls=true;g.board.inset=35;g.objects=rows(players,s.discs||3,23);}
    if(mode==='chain'){g.board.walls=true;g.nextTarget=1;g.combo=0;g.turnLimit=s.turnLimit||18;g.coop=!!s.coop;g.objects=rows(players,1);for(let n=1;n<=5;n++)g.objects.push(P.body({id:`t${n}`,kind:'target',number:n,x:350+n*105,y:180+(n%2)*330,radius:30,mass:20}));}
    return g;
  }
  function setupHole(g){const h=HOLES[g.hole];g.board={width:W,height:H,walls:true,orientation:'vertical',surface:'golf',cup:{...h.cup},puttingGreen:h.puttingGreen,fairway:h.fairway,bunkers:h.bunkers,rocks:h.rocks,rough:h.rough,holeName:h.name};g.objects=Array.from({length:g.players},(_,t)=>disc(t,h.tee.x,h.tee.y+t*45));g.objects.push(...h.rocks.map((r,i)=>P.body({id:`rock${g.hole}-${i}`,kind:'rock',x:r.x,y:r.y,radius:r.r,mass:1000})));}
  function spawnCoop(g){g.board={width:W,height:H,walls:false};g.objects=Array.from({length:g.players},(_,t)=>disc(t,160,250+t*70));for(let i=0;i<2+g.wave;i++)g.objects.push(P.body({id:`g${g.wave}-${i}`,kind:'goblin',team:-1,x:720+i*75,y:230+(i%3)*120,radius:i===0?34:27,mass:i===0?2.5:1,heavy:i===0}));}
  function eligibleObjects(g, player=g.turn){
    if(g.phase!=='aiming')return[];
    if(g.mode==='coop')return g.objects.filter(o=>o.active&&o.kind==='disc'&&o.team===player);
    return g.objects.filter(o=>o.active&&o.kind==='disc'&&o.team===player);
  }
  function markShot(g,id){if(!eligibleObjects(g).some(o=>o.id===id))return false;g.phase='simulating';g.lastShot=id;g.shot++;if(g.mode==='golf')g.scores[g.turn]++;if(g.mode==='coop')g.turnBudget--;return true;}
  function beginGoblinCounter(g,id){const o=g.objects.find(o=>o.id===id&&o.active&&o.kind==='goblin');if(g.mode!=='coop'||g.phase!=='counter'||!o)return false;g.phase='simulating';g.counterActive=true;g.lastCounter=id;return true;}
  function activeTeams(g){return new Set(g.objects.filter(o=>o.active&&o.kind==='disc').map(o=>o.team));}
  function advance(g){
    const active=activeTeams(g);
    for(let i=1;i<=g.players;i++){const next=(g.turn+i)%g.players;if(active.has(next)){if(next<=g.turn)g.round++;g.turn=next;g.phase='aiming';return true;}}
    g.phase='finished';g.winner=null;return false;
  }
  function ensureActiveTurn(g){if(activeTeams(g).has(g.turn)){g.phase='aiming';return true;}return advance(g);}
  function resolve(g,events=[]){events=P.accumulateEvents([],events);g.phase='resolution';g.events=events;
    if(g.mode==='coop'&&g.counterActive){g.counterActive=false;if(!g.objects.some(o=>o.active&&o.kind==='disc')){g.phase='finished';g.winner=null;return;}if(!g.objects.some(o=>o.active&&o.kind==='goblin')){g.wave++;if(g.wave>3){g.phase='finished';g.winner=0;return;}g.turnBudget+=8;spawnCoop(g);}if(g.turnBudget<=0){g.phase='finished';g.winner=null;return;}ensureActiveTurn(g);return;}
    if(g.mode==='classic'){const alive=new Set(g.objects.filter(o=>o.active).map(o=>o.team));if(alive.size<=1){g.phase='finished';g.winner=[...alive][0]??null;return;}}
    if(g.mode==='football'){for(const e of events.filter(e=>e.type==='goal')){const scorer=e.side==='top'?0:1;g.scores[scorer]++;const ball=g.objects.find(o=>o.kind==='ball');Object.assign(ball,{x:600,y:360,vx:0,vy:0,active:true});if(g.scores[scorer]>=Math.max(1,g.settings.targetScore||3)){g.winner=scorer;g.phase='finished';return;}}}
    if(g.mode==='line'){g.attempts[g.turn].push({complete:true});if(g.attempts.every(a=>a.length>=1)){g.attempts=g.attempts.map((_,team)=>{const o=g.objects.find(d=>d.kind==='disc'&&d.team===team),legal=!!o&&o.active&&o.y>=g.board.targetLine&&o.y<=H;return[{legal,distance:legal?o.y-g.board.targetLine:null}]});const best=Math.min(...g.attempts.flat().filter(v=>v.legal).map(v=>v.distance),Infinity);const leaders=g.attempts.map((a,i)=>a.some(v=>v.legal&&v.distance===best)?i:null).filter(i=>i!==null);g.winner=leaders.length===1?leaders[0]:null;g.phase='finished';return;}}
    if(g.mode==='golf'){const o=g.objects.find(o=>o.kind==='disc'&&o.team===g.turn);const sunk=events.some(e=>e.type==='cup'&&e.team===g.turn)||(!o?.active||Math.hypot(o.x-g.board.cup.x,o.y-g.board.cup.y)<g.board.cup.r);if(sunk&&o){o.active=false;o.vx=o.vy=0;}const active=g.objects.filter(d=>d.kind==='disc'&&d.active);if(sunk&&!active.length){g.hole++;if(g.hole>=HOLES.length){const low=Math.min(...g.scores),leaders=g.scores.map((score,i)=>score===low?i:null).filter(i=>i!==null);g.phase='finished';g.winner=leaders.length===1?leaders[0]:null;return;}g.turn=0;setupHole(g);g.phase='aiming';return;}for(let i=1;i<=g.players;i++){const next=(g.turn+i)%g.players;if(active.some(d=>d.team===next)){if(next<=g.turn)g.round++;g.turn=next;g.phase='aiming';return;}}g.phase='finished';return;}
    if(g.mode==='coop'){if(!g.objects.some(o=>o.active&&o.kind==='disc')){g.phase='finished';g.winner=null;return;}if(!g.objects.some(o=>o.active&&o.kind==='goblin')){g.wave++;if(g.wave>3){g.phase='finished';g.winner=0;return;}g.turnBudget+=8;spawnCoop(g);advance(g);return;}if(g.turnBudget<=0){g.phase='finished';g.winner=null;return;}if(!advance(g))return;g.phase='counter';return;}
    if(g.mode==='royal'){g.board.inset=35+Math.max(0,g.round-1)*28;for(const o of g.objects)if(o.active&&(o.x-o.radius<g.board.inset||o.x+o.radius>W-g.board.inset||o.y-o.radius<g.board.inset||o.y+o.radius>H-g.board.inset))o.active=false;const alive=new Set(g.objects.filter(o=>o.active).map(o=>o.team));if(alive.size<=1){g.phase='finished';g.winner=[...alive][0]??null;return;}}
    if(g.mode==='chain'){for(const e of events.filter(e=>e.type==='target'))if(e.number===g.nextTarget){g.scores[e.team]++;g.nextTarget++;g.combo++;}else g.combo=0;if(g.nextTarget>5){g.phase='finished';if(g.coop)g.winner=0;else{const high=Math.max(...g.scores),leaders=g.scores.map((score,index)=>score===high?index:null).filter(index=>index!==null);g.winner=leaders.length===1?leaders[0]:null;}return;}if(g.shot>=g.turnLimit){g.phase='finished';g.winner=null;if(!g.coop){const high=Math.max(...g.scores),leaders=g.scores.map((score,index)=>score===high?index:null).filter(index=>index!==null);if(leaders.length===1)g.winner=leaders[0];}return;}}
    advance(g);
  }
  function adjudicate(g){
    if(g.phase!=='finished')return null;
    const cooperative=g.mode==='coop'||(g.mode==='chain'&&g.coop);
    const solo=g.players===1;
    const outcome=cooperative?(g.winner==null?'defeat':'victory'):solo?(g.winner==null?'defeat':'victory'):g.winner==null?'draw':'competitive-win';
    return {mode:g.mode,outcome,winner:g.winner,defeated:g.winner==null?[]:Array.from({length:g.players},(_,i)=>i).filter(i=>i!==g.winner)};
  }
  return {MODES:['classic','football','line','golf','coop','royal','chain'],FORMATIONS,FIELD_GEOMETRY,formationPoints,HOLES,setupHole,createGame,eligibleObjects,markShot,beginGoblinCounter,resolve,adjudicate};
});
