(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.StitchkeeperRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TEAR_CORRIDOR_RADIUS = 70;
  const MOTH_CONTACT_RADIUS = 28;
  const DEFAULT_DIFFICULTY_ID = 'normal';
  const CHARM_DRAFT_AFTER_NIGHTS = Object.freeze([3, 6, 9]);
  const CHARM_CATALOG = Object.freeze([
    {id:'iron-spool',sigil:'◉',nameKo:'쇠실패',nameEn:'IRON SPOOL',effectKo:'최대 실 +35 · 획득 시 실 35 회복',effectEn:'MAX THREAD +35 · RESTORE 35'},
    {id:'moon-thimble',sigil:'◒',nameKo:'달 골무',nameEn:'MOON THIMBLE',effectKo:'최대 골무 +1 · 획득 시 전부 회복',effectEn:'MAX THIMBLES +1 · REFILL'},
    {id:'broad-eye',sigil:'◇',nameKo:'넓은 바늘귀',nameEn:'BROAD EYE',effectKo:'바느질 범위 +9px',effectEn:'STITCH CORRIDOR +9PX'},
    {id:'waxed-thread',sigil:'≋',nameKo:'밀랍실',nameEn:'WAXED THREAD',effectKo:'실 절단 접촉 시간 ×1.30',effectEn:'CUT CONTACT ×1.30'},
    {id:'lantern-ash',sigil:'✦',nameKo:'등불 재',nameEn:'LANTERN ASH',effectKo:'나방 속도·가속 ×0.88',effectEn:'MOTH SPEED · ACCEL ×0.88'},
    {id:'echo-knot',sigil:'◎',nameKo:'메아리 매듭',nameEn:'ECHO KNOT',effectKo:'솔기마다 145px 수호 파동',effectEn:'145PX WARD EACH SEAM'},
    {id:'golden-needle',sigil:'†',nameKo:'금빛 바늘',nameEn:'GOLDEN NEEDLE',effectKo:'모든 점수 ×1.20',effectEn:'ALL SCORE ×1.20'},
    {id:'menders-heart',sigil:'♥',nameKo:'꿰맨 심장',nameEn:"MENDER'S HEART",effectKo:'최대 온전함 +1 · 획득 시 1 회복',effectEn:'MAX INTEGRITY +1 · RESTORE 1'},
    {id:'dawn-salt',sigil:'✣',nameKo:'새벽 소금',nameEn:'DAWN SALT',effectKo:'이후 밤마다 +12초',effectEn:'+12S EACH LATER NIGHT'}
  ].map(Object.freeze));
  const CHARM_BY_ID = Object.freeze(Object.fromEntries(CHARM_CATALOG.map(charm=>[charm.id,charm])));
  const EMPTY_CHARM_EFFECTS = Object.freeze({maxThreadBonus:0,pickupThread:0,maxPulsesBonus:0,refillPulsesOnPickup:false,corridorBonus:0,cutContactMultiplier:1,mothSpeedMultiplier:1,mothAccelerationMultiplier:1,seamWardRadius:0,scoreMultiplier:1,maxIntegrityBonus:0,pickupIntegrity:0,subsequentNightSeconds:0});
  function aggregateCharmEffects(ownedIds){
    const effects={...EMPTY_CHARM_EFFECTS},owned=new Set(Array.isArray(ownedIds)?ownedIds:[]);
    for(const id of owned){if(!CHARM_BY_ID[id])continue;
      if(id==='iron-spool'){effects.maxThreadBonus+=35;effects.pickupThread+=35;}
      else if(id==='moon-thimble'){effects.maxPulsesBonus+=1;effects.refillPulsesOnPickup=true;}
      else if(id==='broad-eye')effects.corridorBonus+=9;
      else if(id==='waxed-thread')effects.cutContactMultiplier*=1.3;
      else if(id==='lantern-ash'){effects.mothSpeedMultiplier*=.88;effects.mothAccelerationMultiplier*=.88;}
      else if(id==='echo-knot')effects.seamWardRadius=145;
      else if(id==='golden-needle')effects.scoreMultiplier*=1.2;
      else if(id==='menders-heart'){effects.maxIntegrityBonus+=1;effects.pickupIntegrity+=1;}
      else if(id==='dawn-salt')effects.subsequentNightSeconds+=12;
    }
    return Object.freeze(effects);
  }
  function createCharmDraft(runSeed,clearedNight,ownedIds){
    const owned=new Set((Array.isArray(ownedIds)?ownedIds:[]).filter(id=>CHARM_BY_ID[id]));
    const choices=CHARM_CATALOG.filter(charm=>!owned.has(charm.id));
    const random=seededRandom(`${runSeed}:charm-draft:${clearedNight}`);
    for(let index=choices.length-1;index>0;index--){const other=Math.floor(random()*(index+1));[choices[index],choices[other]]=[choices[other],choices[index]];}
    return Object.freeze(choices.slice(0,3));
  }
  const TEAR_TRAITS = Object.freeze([
    {id:'plain',glyph:'·',nameKo:'일반 솔기',nameEn:'PLAIN',color:'#c89b4a',scoreMultiplier:1,corridorMultiplier:1,cutContactMultiplier:1,wardRadius:0,restorePulses:0},
    {id:'moon',glyph:'◒',nameKo:'달빛 솔기',nameEn:'MOON',color:'#aab9ca',scoreMultiplier:1.25,corridorMultiplier:1,cutContactMultiplier:1,wardRadius:0,restorePulses:1},
    {id:'ward',glyph:'◎',nameKo:'수호 솔기',nameEn:'WARD',color:'#87a59a',scoreMultiplier:1.15,corridorMultiplier:1,cutContactMultiplier:1,wardRadius:170,restorePulses:0},
    {id:'thorn',glyph:'✕',nameKo:'가시 솔기',nameEn:'THORN',color:'#b6634e',scoreMultiplier:1.7,corridorMultiplier:.7,cutContactMultiplier:.8,wardRadius:0,restorePulses:0}
  ].map(Object.freeze));
  const TEAR_TRAIT_BY_ID=Object.freeze(Object.fromEntries(TEAR_TRAITS.map(trait=>[trait.id,trait])));
  const ECLIPSE_NIGHTS=Object.freeze([4,8,12]);
  const ECLIPSE_ON=Object.freeze({isEclipse:true,mothBonus:1,speedMultiplier:1.12,accelerationMultiplier:1.15,scoreMultiplier:1.35});
  const ECLIPSE_OFF=Object.freeze({isEclipse:false,mothBonus:0,speedMultiplier:1,accelerationMultiplier:1,scoreMultiplier:1});
  function getEclipseModifiers(nightNumber){return ECLIPSE_NIGHTS.includes(Number(nightNumber))?ECLIPSE_ON:ECLIPSE_OFF;}
  function assignTearTraits(runSeed,nightNumber,count){
    const requested=Math.max(0,Math.floor(Number(count)||0)),night=Math.floor(Number(nightNumber)||0),traits=Array(requested).fill('plain');
    if(night<=1||requested===0)return Object.freeze(traits);
    const random=seededRandom(`${runSeed}:traits:${night}:${requested}`),indices=traits.map((_,index)=>index);
    for(let index=indices.length-1;index>0;index--){const other=Math.floor(random()*(index+1));[indices[index],indices[other]]=[indices[other],indices[index]];}
    if(night===2||night===3){traits[indices[0]]=['moon','ward','thorn'][Math.floor(random()*3)];return Object.freeze(traits);}
    let cursor=0;
    if(ECLIPSE_NIGHTS.includes(night)&&requested>=2){traits[indices[cursor++]]='ward';traits[indices[cursor++]]='thorn';}
    else traits[indices[cursor++]]=['moon','ward','thorn'][Math.floor(random()*3)];
    const extra=Math.min(requested-cursor,Math.floor(random()*Math.max(1,Math.ceil(requested/3))));
    for(let added=0;added<extra;added++){const options=['moon','ward','thorn'];let chosen=options[Math.floor(random()*options.length)];if(chosen==='thorn'&&traits.filter(id=>id==='thorn').length>=Math.floor(requested/2))chosen='moon';traits[indices[cursor++]]=chosen;}
    return Object.freeze(traits);
  }
  const DIFFICULTY_PROFILES = Object.freeze({
    gentle: Object.freeze({
      id: 'gentle', labelKo: '다정한 밤', labelEn: 'GENTLE',
      descriptionKo: '느린 날개와 긴 여유', idleSpeed: 46, activeSpeed: 135,
      idleAcceleration: 20, activeAcceleration: 92, reactionDelay: 0.62,
      mothScale: 0.75, cutContactSeconds: 0.42, pulseStunSeconds: 2.8, scoreMultiplier: 0.8
    }),
    normal: Object.freeze({
      id: 'normal', labelKo: '보통 밤', labelEn: 'NORMAL',
      descriptionKo: '바늘과 나방의 균형', idleSpeed: 66, activeSpeed: 210,
      idleAcceleration: 34, activeAcceleration: 175, reactionDelay: 0.36,
      mothScale: 1, cutContactSeconds: 0.28, pulseStunSeconds: 2.1, scoreMultiplier: 1
    }),
    hard: Object.freeze({
      id: 'hard', labelKo: '거친 밤', labelEn: 'HARD',
      descriptionKo: '빠른 추격, 짧은 숨', idleSpeed: 105, activeSpeed: 340,
      idleAcceleration: 72, activeAcceleration: 360, reactionDelay: 0.16,
      mothScale: 1.2, cutContactSeconds: 0.2, pulseStunSeconds: 1.55, scoreMultiplier: 1.35
    }),
    hell: Object.freeze({
      id: 'hell', labelKo: '지옥', labelEn: 'HELL',
      descriptionKo: '폭풍처럼 달려드는 먹물 나방', idleSpeed: 230, activeSpeed: 680,
      idleAcceleration: 210, activeAcceleration: 820, reactionDelay: 0.06,
      mothScale: 1.45, cutContactSeconds: 0.13, pulseStunSeconds: 1.05, scoreMultiplier: 1.9
    }),
    impossible: Object.freeze({
      id: 'impossible', labelKo: '불가능', labelEn: 'IMPOSSIBLE',
      descriptionKo: '눈보다 빠른, 거의 불가능한 밤', idleSpeed: 390, activeSpeed: 1080,
      idleAcceleration: 430, activeAcceleration: 1450, reactionDelay: 0.015,
      mothScale: 1.75, cutContactSeconds: 0.085, pulseStunSeconds: 0.7, scoreMultiplier: 2.8
    })
  });
  const CAMPAIGN_NIGHTS = Object.freeze([
    { number:1, titleKo:'첫 단', titleEn:'FIRST HEM', tears:3, moths:2, timeSeconds:52, wind:5, hue:'#53657a' },
    { number:2, titleKo:'이슬의 실', titleEn:'DEW THREAD', tears:3, moths:2, timeSeconds:54, wind:7, hue:'#596176' },
    { number:3, titleKo:'잔영의 뒷면', titleEn:'REVERSE SHADOW', tears:4, moths:3, timeSeconds:58, wind:9, hue:'#5e5c70' },
    { number:4, titleKo:'달의 가장자리', titleEn:'MOON SELVAGE', tears:4, moths:3, timeSeconds:60, wind:12, hue:'#63586a' },
    { number:5, titleKo:'잔바람 매듭', titleEn:'WIND KNOT', tears:5, moths:4, timeSeconds:64, wind:15, hue:'#675563' },
    { number:6, titleKo:'푸른 풀림', titleEn:'BLUE UNRAVELLING', tears:5, moths:4, timeSeconds:66, wind:18, hue:'#66515d' },
    { number:7, titleKo:'깊은 솔기', titleEn:'DEEP PINE SEAM', tears:6, moths:5, timeSeconds:70, wind:21, hue:'#694f56' },
    { number:8, titleKo:'재의 주름', titleEn:'ASHEN PLEAT', tears:6, moths:5, timeSeconds:72, wind:24, hue:'#6c504e' },
    { number:9, titleKo:'비단 폭우', titleEn:'SILK TEMPEST', tears:7, moths:6, timeSeconds:76, wind:28, hue:'#704f48' },
    { number:10, titleKo:'먹빛 심장', titleEn:'INK HEART', tears:7, moths:6, timeSeconds:78, wind:32, hue:'#744e43' },
    { number:11, titleKo:'새벽의 상처', titleEn:'DAWN WOUND', tears:8, moths:7, timeSeconds:82, wind:36, hue:'#78503e' },
    { number:12, titleKo:'마지막 꿰매기', titleEn:'THE LAST STITCH', tears:8, moths:8, timeSeconds:86, wind:41, hue:'#7d543b' }
  ].map(Object.freeze));
  const TOTAL_NIGHTS = CAMPAIGN_NIGHTS.length;
  const PLAYABLE_SAFE_AREA = Object.freeze({ left:140, right:1140, top:135, bottom:665 });
  const MIN_TEAR_SEPARATION = 145;
  const MIN_CROSS_TEAR_ENDPOINT_DISTANCE = 40;
  const MIN_CROSS_TEAR_PATH_CLEARANCE = 22;
  const MAX_LAYOUT_ATTEMPTS = 128;
  function freezePoints(points){ return Object.freeze(points.map(([x,y])=>Object.freeze({x,y}))); }
  const PATTERN_CATALOG = Object.freeze([
    ['crescent-ladder','초승 사다리','CRESCENT LADDER','arc',[[-.44,-.08],[-.36,-.29],[-.17,-.43],[.07,-.46],[.29,-.35],[.42,-.16],[.38,.08],[.2,.25]]],
    ['fox-path','여우 길','FOX PATH','zigzag',[[-.45,-.35],[-.25,-.12],[-.05,-.37],[.17,-.08],[.4,-.31],[.28,.08],[.04,.32],[-.25,.21]]],
    ['rain-loom','비의 베틀','RAIN LOOM','columns',[[-.44,-.44],[-.44,-.12],[-.44,.2],[-.44,.46],[.36,-.38],[.36,-.02],[.36,.27],[.36,.43]]],
    ['pine-ribs','솔 갈비','PINE RIBS','spine',[[0,-.47],[-.2,-.3],[.23,-.22],[-.34,-.04],[.36,.05],[-.27,.24],[.2,.35],[0,.47]]],
    ['crane-wing','학의 날개','CRANE WING','wings',[[-.47,.34],[-.36,-.02],[-.21,-.34],[0,.08],[.21,-.34],[.36,-.02],[.47,.34],[0,-.47]]],
    ['broken-halo','깨진 광륜','BROKEN HALO','ring',[[0,-.47],[.37,-.29],[.46,.1],[.2,.42],[-.2,.42],[-.46,.1],[-.37,-.29],[0,0]]],
    ['river-knots','강의 매듭','RIVER KNOTS','river',[[-.46,-.38],[-.18,-.42],[.04,-.2],[-.18,.02],[-.4,.18],[-.18,.4],[.16,.43],[.46,.2]]],
    ['moth-orbit','나방의 궤도','MOTH ORBIT','orbit',[[-.42,-.1],[-.25,-.38],[.06,-.42],[.37,-.25],[.44,.12],[.18,.37],[-.16,.43],[-.31,.13]]],
    ['needle-rain','바늘비','NEEDLE RAIN','diagonals',[[-.44,-.45],[-.14,-.43],[.17,-.33],[.43,-.18],[-.4,.03],[-.13,.16],[.15,.31],[.42,.46]]],
    ['sleeping-reeds','잠든 갈대','SLEEPING REEDS','reeds',[[-.47,-.24],[-.3,-.34],[-.13,-.27],[.04,-.37],[.2,-.3],[.34,-.4],[.47,-.31],[-.08,.43]]],
    ['ash-crown','재의 왕관','ASH CROWN','crown',[[-.47,.35],[-.4,-.02],[-.28,-.42],[-.1,-.08],[.04,-.46],[.21,-.04],[.37,-.39],[.47,.34]]],
    ['salt-constellation','소금 별자리','SALT CONSTELLATION','cluster',[[-.43,-.3],[-.2,-.42],[-.29,.03],[-.04,-.09],[.05,.38],[.2,-.37],[.32,.01],[.45,.3]]],
    ['moon-basket','달 광주리','MOON BASKET','basket',[[-.45,-.24],[-.24,-.39],[.02,-.32],[.3,-.41],[.44,-.19],[.35,.22],[.02,.43],[-.33,.25]]],
    ['winter-spine','겨울 등뼈','WINTER SPINE','spine',[[-.12,-.47],[.11,-.34],[-.08,-.2],[.15,-.06],[-.15,.08],[.11,.22],[-.1,.36],[.13,.47]]],
    ['silk-delta','비단 삼각주','SILK DELTA','delta',[[0,-.47],[-.12,-.2],[-.25,.05],[-.39,.3],[-.47,.45],[-.14,.45],[.18,.45],[.47,.45]]],
    ['lantern-fall','등불 낙하','LANTERN FALL','fall',[[-.46,-.44],[-.16,-.44],[.15,-.44],[.46,-.44],[-.29,-.05],[.28,-.02],[-.11,.29],[.1,.46]]],
    ['quiet-antlers','고요한 뿔','QUIET ANTLERS','antlers',[[0,.47],[0,.12],[-.18,-.08],[-.4,-.18],[-.46,-.45],[-.2,-.4],[.2,-.12],[.45,-.38]]],
    ['cloud-seam','구름 솔기','CLOUD SEAM','cloud',[[-.46,.03],[-.34,-.25],[-.09,-.37],[.1,-.18],[.34,-.31],[.46,0],[.26,.28],[-.13,.39]]],
    ['black-tide','검은 물결','BLACK TIDE','wave',[[-.47,.02],[-.35,-.32],[-.16,-.46],[.04,-.25],[.18,.16],[.32,.43],[.47,.28],[.28,-.04]]],
    ['thimble-garden','골무 정원','THIMBLE GARDEN','garden',[[-.4,-.37],[-.08,-.45],[.27,-.36],[-.27,-.08],[.08,-.03],[.42,.05],[-.15,.31],[.25,.43]]],
    ['star-well','별 우물','STAR WELL','star',[[0,-.46],[.12,-.13],[.43,-.15],[.18,.07],[.29,.4],[0,.2],[-.31,.42],[-.18,.05]]],
    ['paper-bridge','종이 다리','PAPER BRIDGE','bridge',[[-.45,-.3],[-.15,-.32],[.15,-.32],[.45,-.3],[-.38,.05],[-.38,.43],[.38,.05],[.38,.43]]],
    ['dawn-fan','새벽 부채','DAWN FAN','fan',[[0,.45],[-.46,.18],[-.31,-.02],[-.15,-.22],[0,-.47],[.14,-.2],[.4,.06],[.47,.28]]],
    ['last-braid','마지막 땋은 머리','LAST BRAID','braid',[[-.28,-.46],[.28,-.34],[-.26,-.2],[.3,-.06],[-.3,.08],[.25,.23],[-.22,.36],[.18,.47]]]
  ].map(([id,nameKo,nameEn,family,points])=>Object.freeze({id,nameKo,nameEn,family,points:freezePoints(points)})));
  const PATTERN_BY_ID = Object.freeze(Object.fromEntries(PATTERN_CATALOG.map(pattern=>[pattern.id,pattern])));

  function hashSeed(value){
    const text=String(value);let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return hash>>>0;
  }
  function seededRandom(seed){
    let state=typeof seed==='number'?seed>>>0:hashSeed(seed);
    return function random(){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  }
  function createRunPlan(seed){
    const code=String(seed);const random=seededRandom(code);let previous=-1;
    return Object.freeze(CAMPAIGN_NIGHTS.map((night,index)=>{
      let catalogIndex=Math.floor(random()*PATTERN_CATALOG.length);
      if(catalogIndex===previous)catalogIndex=(catalogIndex+1+Math.floor(random()*(PATTERN_CATALOG.length-1)))%PATTERN_CATALOG.length;
      previous=catalogIndex;const variant=Math.floor(random()*64);const layoutSeed=hashSeed(`${code}:${index}:${catalogIndex}:${variant}`);
      return Object.freeze({night:night.number,patternId:PATTERN_CATALOG[catalogIndex].id,patternNameKo:PATTERN_CATALOG[catalogIndex].nameKo,patternNameEn:PATTERN_CATALOG[catalogIndex].nameEn,variant,layoutSeed});
    }));
  }
  function round2(value){return Math.round(value*100)/100;}
  function buildTearSpecs(pattern,random,requested){
    const order=pattern.points.map((_,index)=>index);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    const mirror=random()<.5?-1:1,turn=Math.floor(random()*4);const specs=[],centers=[];
    for(let slot=0;slot<requested;slot++){
      const source=pattern.points[order[slot]],sx=source.x*mirror,sy=source.y;let nx=sx,ny=sy;
      if(turn===1){nx=-sy;ny=sx;}else if(turn===2){nx=-sx;ny=-sy;}else if(turn===3){nx=sy;ny=-sx;}
      let x=round2(640+nx*850+(random()-.5)*24),y=round2(405+ny*400+(random()-.5)*20);
      if(centers.some(point=>Math.hypot(x-point.x,y-point.y)<MIN_TEAR_SEPARATION)){
        const fallback=[];for(let row=0;row<3;row++)for(let column=0;column<4;column++)fallback.push({x:250+column*260,y:220+row*185});
        const available=fallback.find(point=>centers.every(existing=>Math.hypot(point.x-existing.x,point.y-existing.y)>=MIN_TEAR_SEPARATION));
        x=available.x;y=available.y;
      }
      centers.push({x,y});
      const angle=round2((random()-.5)*1.7+(slot%2?.3:-.3)),length=round2(92+random()*35);
      const dx=Math.cos(angle)*length*.5,dy=Math.sin(angle)*length*.5,a=Object.freeze({x:round2(x-dx),y:round2(y-dy)}),b=Object.freeze({x:round2(x+dx),y:round2(y+dy)}),path=[];
      for(let step=0;step<=8;step++){const t=step/8,offset=(random()-.5)*13*Math.sin(t*Math.PI),px=a.x+(b.x-a.x)*t+Math.cos(angle+Math.PI/2)*offset,py=a.y+(b.y-a.y)*t+Math.sin(angle+Math.PI/2)*offset;path.push(Object.freeze({x:round2(px),y:round2(py)}));}
      specs.push(Object.freeze({id:slot,x,y,length,angle,a,b,path:Object.freeze(path)}));
    }
    return Object.freeze(specs);
  }
  function buildSafeFallback(layoutSeed,requested){
    const random=seededRandom(hashSeed(`${layoutSeed}:safe-fallback`));const specs=[];
    const centers=[{x:240,y:245},{x:500,y:245},{x:780,y:245},{x:1040,y:245},{x:240,y:555},{x:500,y:555},{x:780,y:555},{x:1040,y:555}];
    for(let slot=0;slot<requested;slot++){
      const {x,y}=centers[slot],angle=round2((random()-.5)*.42),length=round2(92+random()*12);
      const dx=Math.cos(angle)*length*.5,dy=Math.sin(angle)*length*.5,a=Object.freeze({x:round2(x-dx),y:round2(y-dy)}),b=Object.freeze({x:round2(x+dx),y:round2(y+dy)}),path=[];
      for(let step=0;step<=8;step++){const t=step/8,offset=(random()-.5)*9*Math.sin(t*Math.PI),px=a.x+(b.x-a.x)*t+Math.cos(angle+Math.PI/2)*offset,py=a.y+(b.y-a.y)*t+Math.sin(angle+Math.PI/2)*offset;path.push(Object.freeze({x:round2(px),y:round2(py)}));}
      specs.push(Object.freeze({id:slot,x,y,length,angle,a,b,path:Object.freeze(path)}));
    }
    return Object.freeze(specs);
  }
  function generateTearSpecs(patternId,layoutSeed,count){
    const pattern=PATTERN_BY_ID[patternId];if(!pattern)throw new Error(`Unknown pattern: ${patternId}`);
    const requested=Math.max(0,Math.min(8,Math.floor(count)));
    for(let attempt=0;attempt<MAX_LAYOUT_ATTEMPTS;attempt++){
      const seed=attempt===0?layoutSeed:hashSeed(`${layoutSeed}:layout-attempt:${attempt}`);
      const specs=buildTearSpecs(pattern,seededRandom(seed),requested);
      if(validateTearLayout(specs).valid)return specs;
    }
    const fallback=buildSafeFallback(layoutSeed,requested);
    if(!validateTearLayout(fallback).valid)throw new Error('Internal safe tear-layout fallback failed validation');
    return fallback;
  }
  function segmentsIntersect(a,b,c,d){
    const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
    const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b),epsilon=1e-9;
    const on=(p,q,r)=>Math.abs(cross(p,q,r))<=epsilon&&r.x>=Math.min(p.x,q.x)-epsilon&&r.x<=Math.max(p.x,q.x)+epsilon&&r.y>=Math.min(p.y,q.y)-epsilon&&r.y<=Math.max(p.y,q.y)+epsilon;
    return ((abC>epsilon&&abD< -epsilon||abC< -epsilon&&abD>epsilon)&&(cdA>epsilon&&cdB< -epsilon||cdA< -epsilon&&cdB>epsilon))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
  }
  function segmentToSegmentDistance(a,b,c,d){
    if(segmentsIntersect(a,b,c,d))return 0;
    return Math.min(pointToSegmentDistance(a,c,d),pointToSegmentDistance(b,c,d),pointToSegmentDistance(c,a,b),pointToSegmentDistance(d,a,b));
  }
  function polylineToPolylineDistance(first,second){
    if(!Array.isArray(first)||!Array.isArray(second)||first.length===0||second.length===0)return Infinity;
    if(first.length===1)return pointToPolylineDistance(first[0],second);
    if(second.length===1)return pointToPolylineDistance(second[0],first);
    let nearest=Infinity;
    for(let i=1;i<first.length;i++)for(let j=1;j<second.length;j++)nearest=Math.min(nearest,segmentToSegmentDistance(first[i-1],first[i],second[j-1],second[j]));
    return nearest;
  }
  function validateTearLayout(specs){
    const reasons=[];const area=PLAYABLE_SAFE_AREA;
    for(let i=0;i<specs.length;i++){
      const tear=specs[i],points=[tear.a,tear.b,...tear.path];
      if(points.some(point=>!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<area.left||point.x>area.right||point.y<area.top||point.y>area.bottom))reasons.push(`tear ${i} leaves safe area`);
      for(let j=0;j<i;j++){
        const other=specs[j];
        if(Math.hypot(tear.x-other.x,tear.y-other.y)<MIN_TEAR_SEPARATION)reasons.push(`tears ${j}/${i} centers overlap`);
        const endpointDistance=Math.min(...[tear.a,tear.b].flatMap(endpoint=>[other.a,other.b].map(otherEndpoint=>Math.hypot(endpoint.x-otherEndpoint.x,endpoint.y-otherEndpoint.y))));
        if(endpointDistance<MIN_CROSS_TEAR_ENDPOINT_DISTANCE)reasons.push(`tears ${j}/${i} endpoints are too close`);
        if(polylineToPolylineDistance(tear.path,other.path)<MIN_CROSS_TEAR_PATH_CLEARANCE)reasons.push(`tears ${j}/${i} paths overlap`);
      }
    }
    return Object.freeze({valid:reasons.length===0,reasons:Object.freeze(reasons)});
  }
  const MOTH_TUNING = Object.freeze({
    idleAcceleration: Object.freeze([25, 32, 39]),
    idleMaxSpeed: Object.freeze([58, 68, 78]),
    activeAcceleration: Object.freeze([125, 160, 195]),
    activeMaxSpeed: Object.freeze([170, 205, 240]),
    contactRadius: MOTH_CONTACT_RADIUS,
    cutContactSeconds: 0.24,
    dangerTelegraphRatio: 0.55
  });
  function pointToSegmentDistance(point, start, end) {
    const dx=end.x-start.x, dy=end.y-start.y, lengthSquared=dx*dx+dy*dy;
    if(lengthSquared===0) return Math.hypot(point.x-start.x,point.y-start.y);
    const t=Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/lengthSquared));
    return Math.hypot(point.x-(start.x+t*dx),point.y-(start.y+t*dy));
  }
  function pointToPolylineDistance(point, polyline) {
    if(!Array.isArray(polyline)||polyline.length===0) return Infinity;
    if(polyline.length===1) return Math.hypot(point.x-polyline[0].x,point.y-polyline[0].y);
    let nearest=Infinity;
    for(let i=1;i<polyline.length;i++) nearest=Math.min(nearest,pointToSegmentDistance(point,polyline[i-1],polyline[i]));
    return nearest;
  }
  function isPointInTearCorridor(point, polyline, radius=TEAR_CORRIDOR_RADIUS) {
    return pointToPolylineDistance(point,polyline)<=radius;
  }
  function isMothTouchingThread(mothPoint, threadPoints, radius) {
    return pointToPolylineDistance(mothPoint,threadPoints)<=radius;
  }
  return Object.freeze({TEAR_CORRIDOR_RADIUS,MOTH_CONTACT_RADIUS,DEFAULT_DIFFICULTY_ID,CHARM_DRAFT_AFTER_NIGHTS,CHARM_CATALOG,aggregateCharmEffects,createCharmDraft,TEAR_TRAITS,TEAR_TRAIT_BY_ID,ECLIPSE_NIGHTS,getEclipseModifiers,assignTearTraits,DIFFICULTY_PROFILES,CAMPAIGN_NIGHTS,TOTAL_NIGHTS,PLAYABLE_SAFE_AREA,MIN_TEAR_SEPARATION,MIN_CROSS_TEAR_ENDPOINT_DISTANCE,MIN_CROSS_TEAR_PATH_CLEARANCE,MAX_LAYOUT_ATTEMPTS,PATTERN_CATALOG,MOTH_TUNING,hashSeed,seededRandom,createRunPlan,generateTearSpecs,validateTearLayout,pointToSegmentDistance,segmentToSegmentDistance,pointToPolylineDistance,polylineToPolylineDistance,isPointInTearCorridor,isMothTouchingThread});
});
