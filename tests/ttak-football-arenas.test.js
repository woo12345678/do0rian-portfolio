const assert=require('node:assert/strict');
const R=require('../games/ttak-club/v1.0.3/shared/rules');
const P=require('../games/ttak-club/v1.0.3/shared/physics');
const AI=require('../games/ttak-club/v1.0.3/shared/ai');

const create=(arena,rng=()=>0)=>R.createGame({mode:'football',players:2,settings:{discs:3,targetScore:3,footballArena:arena},rng});
const activeBodies=game=>game.objects.filter(object=>object.active);
const circleGap=(body,circle)=>Math.hypot(body.x-circle.x,body.y-circle.y)-body.radius-circle.radius;
const rectGap=(body,rect)=>{
  const x=Math.max(rect.x,Math.min(body.x,rect.x+rect.w));
  const y=Math.max(rect.y,Math.min(body.y,rect.y+rect.h));
  return Math.hypot(body.x-x,body.y-y)-body.radius;
};

assert.deepEqual(Object.keys(R.FOOTBALL_ARENAS),['classic','spring','fortress'],'three actual football arenas are public rule data');

const classic=create('classic');
assert.equal(classic.settings.footballArena,'classic');
assert.deepEqual(classic.board.bumpers,[],'classic has no spring bumpers');
assert.deepEqual(classic.board.obstacles,[],'classic has no walls');

const spring=create('spring');
assert.equal(spring.settings.footballArena,'spring');
assert.equal(spring.board.bumpers.length,2,'spring arena has two readable bumpers');
assert.deepEqual(spring.board.obstacles,[]);
for(const bumper of spring.board.bumpers){
  assert.ok(bumper.boost>=1.25&&bumper.boost<=1.4,'spring boost is strong but predictable');
  for(const body of activeBodies(spring))assert.ok(circleGap(body,bumper)>=4,`${body.id} starts clear of ${bumper.id}`);
}

const fortress=create('fortress');
assert.equal(fortress.settings.footballArena,'fortress');
assert.equal(fortress.board.obstacles.length,4,'fortress has four short tactical walls');
assert.deepEqual(fortress.board.bumpers,[]);
for(const wall of fortress.board.obstacles){
  for(const body of activeBodies(fortress))assert.ok(rectGap(body,wall)>=4,`${body.id} starts clear of ${wall.id}`);
}
const midX=600;
assert.ok(fortress.board.obstacles.every(wall=>midX<wall.x||midX>wall.x+wall.w),'fortress preserves a visible central attacking lane');
assert.deepEqual(fortress.board.obstacles.map(({x,y,w,h})=>({x,y,w,h})),fortress.board.obstacles.map(({x,y,w,h})=>({x:1200-x-w,y:720-y-h,w,h})).reverse(),'fortress is rotationally fair');

assert.equal(create('random',()=>0).settings.footballArena,'classic','low random roll selects classic');
assert.equal(create('random',()=>0.5).settings.footballArena,'spring','middle random roll selects spring');
assert.equal(create('random',()=>0.999).settings.footballArena,'fortress','high random roll selects fortress');
assert.equal(create('unknown').settings.footballArena,'classic','unknown arena safely falls back to classic');

const moving=P.body({id:'test-ball',kind:'ball',x:544,y:360,vx:500,vy:0,radius:20,mass:.65});
const bumper={id:'spring-test',x:600,y:360,radius:36,boost:1.3};
const before=Math.hypot(moving.vx,moving.vy);
const springEvents=P.step([moving],1/120,{width:1200,height:720,walls:true,bumpers:[bumper],obstacles:[]});
assert.ok(springEvents.some(event=>event.type==='bumper'&&event.id==='spring-test'),'spring collision emits semantic feedback');
assert.ok(moving.vx<0,'spring reflects the moving ball');
assert.ok(Math.hypot(moving.vx,moving.vy)>before,'spring adds bounded speed');
assert.ok(circleGap(moving,bumper)>=-1e-6,'spring collision resolves overlap');

const striker=P.body({id:'test-disc',x:480,y:360,vx:500,vy:0,radius:25});
const wall={id:'wall-test',x:540,y:310,w:30,h:100};
const wallEvents=P.step([striker],.1,{width:1200,height:720,walls:true,bumpers:[],obstacles:[wall]});
assert.ok(wallEvents.some(event=>event.type==='obstacle'&&event.id==='wall-test'),'wall collision emits semantic feedback');
assert.ok(striker.vx<0,'wall reflects the stone');
assert.ok(rectGap(striker,wall)>=-1e-6,'wall collision resolves overlap');

for(const arena of ['spring','fortress']){
  const game=create(arena),bumpers=game.board.bumpers.length,walls=game.board.obstacles.length;
  R.resolve(game,[{type:'goal',side:'top'}]);
  assert.deepEqual(game.scores,[1,0],`${arena} scores a top goal`);
  const ball=game.objects.find(object=>object.kind==='ball');
  assert.deepEqual([ball.x,ball.y,ball.vx,ball.vy,ball.active],[600,360,0,0,true],`${arena} resets the ball`);
  assert.deepEqual([game.board.bumpers.length,game.board.obstacles.length],[bumpers,walls],`${arena} survives goal reset`);
}

for(const arena of ['classic','spring','fortress']){
  const game=create(arena);
  for(let turn=0;turn<12&&game.phase!=='finished';turn++){
    const shot=AI.chooseShot(game,'normal',1000+turn);
    assert.ok(shot,`${arena} AI has a legal shot on turn ${turn}`);
    assert.equal(R.markShot(game,shot.id),true);
    P.applyShot(game.objects.find(object=>object.id===shot.id),shot.force);
    game.pendingEvents=[];
    let ticks=0;
    while(!P.allResting(game.objects)&&ticks<3600){P.accumulateEvents(game.pendingEvents,P.step(game.objects,1/120,game.board));ticks++;}
    assert.ok(ticks<3600,`${arena} settles after turn ${turn}`);
    R.resolve(game,P.consumeEvents(game));
    assert.ok(['aiming','finished'].includes(game.phase),`${arena} advances after turn ${turn}`);
    for(const object of activeBodies(game)){
      for(const bumper of game.board.bumpers||[])assert.ok(Math.hypot(object.x-bumper.x,object.y-bumper.y)>=object.radius+bumper.radius-.01,`${arena} body exits bumper`);
      for(const wall of game.board.obstacles||[]){const x=Math.max(wall.x,Math.min(object.x,wall.x+wall.w)),y=Math.max(wall.y,Math.min(object.y,wall.y+wall.h));assert.ok(Math.hypot(object.x-x,object.y-y)>=object.radius-.01,`${arena} body exits wall`);}
    }
  }
}

console.log('ttak football arena tests passed');
