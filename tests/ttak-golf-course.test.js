const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');
const P = require('../games/ttak-club/v1.0.3/shared/physics');
const AI = require('../games/ttak-club/v1.0.3/shared/ai');

assert.equal(R.HOLES.length, 9, 'Stone Golf provides a full nine-hole course');
for (const [index, hole] of R.HOLES.entries()) {
  assert.ok([3,4,5].includes(hole.par), `hole ${index + 1} has a real golf par`);
  assert.ok(hole.width >= 2200 && hole.height >= 900, `hole ${index + 1} is larger than one screen`);
  assert.ok(hole.route.length >= 4, `hole ${index + 1} has a multi-leg route`);
  assert.deepEqual(hole.route[0], hole.tee, `hole ${index + 1} route starts at the tee`);
  assert.deepEqual(hole.route.at(-1), {x:hole.cup.x,y:hole.cup.y}, `hole ${index + 1} route ends at the cup`);
  const direct = Math.hypot(hole.cup.x-hole.tee.x,hole.cup.y-hole.tee.y);
  const route = hole.route.slice(1).reduce((sum,point,i)=>sum+Math.hypot(point.x-hole.route[i].x,point.y-hole.route[i].y),0);
  const dx=hole.cup.x-hole.tee.x,dy=hole.cup.y-hole.tee.y,length2=dx*dx+dy*dy;
  const bend = Math.max(...hole.route.slice(1,-1).map(point=>Math.abs(dy*point.x-dx*point.y+hole.cup.x*hole.tee.y-hole.cup.y*hole.tee.x)/Math.sqrt(length2)));
  assert.ok(route > direct * 1.08, `hole ${index + 1} route is meaningfully longer than a straight shot`);
  assert.ok(bend >= 180, `hole ${index + 1} bends at least 180px away from the direct line`);
}

const short = R.createGame({mode:'golf',players:1,settings:{holes:3}});
assert.equal(short.settings.holes,3);
assert.equal(short.board.width,R.HOLES[0].width);
assert.equal(short.board.height,R.HOLES[0].height);
assert.equal(short.board.par,R.HOLES[0].par);

const long = R.createGame({mode:'golf',players:1,settings:{holes:9}});
assert.equal(long.settings.holes,9);
const invalid = R.createGame({mode:'golf',players:1,settings:{holes:6}});
assert.equal(invalid.settings.holes,3,'only real 3-hole or 9-hole rounds are accepted');

function sink(game){
  const disc=R.eligibleObjects(game)[0];
  assert.ok(disc,'active golfer exists');
  assert.equal(R.markShot(game,disc.id),true);
  R.resolve(game,[{type:'cup',team:disc.team}]);
}
for(let hole=0;hole<3;hole++)sink(short);
assert.equal(short.phase,'finished','three-hole round finishes after hole 3');
assert.equal(short.golfHistory.length,3);
assert.deepEqual(short.golfHistory.map(entry=>entry.par),R.HOLES.slice(0,3).map(hole=>hole.par));

for(let hole=0;hole<8;hole++){
  sink(long);
  assert.notEqual(long.phase,'finished',`nine-hole round continues after hole ${hole+1}`);
}
sink(long);
assert.equal(long.phase,'finished','nine-hole round finishes after hole 9');
assert.equal(long.golfHistory.length,9);

const surfaceGame = R.createGame({mode:'golf',players:1,settings:{holes:3}});
const fairwayStone=P.body({id:'fairway',x:surfaceGame.board.fairwayPath[0].x,y:surfaceGame.board.fairwayPath[0].y,vx:1000,vy:0,radius:25});
const roughStone=P.body({id:'rough',x:surfaceGame.board.width-160,y:surfaceGame.board.height-160,vx:1000,vy:0,radius:25});
P.step([fairwayStone,roughStone],.1,surfaceGame.board);
assert.ok(fairwayStone.vx>roughStone.vx*1.15,'fairway carries a shot farther than rough');

const waterGame=R.createGame({mode:'golf',players:1,settings:{holes:3}}),waterStone=R.eligibleObjects(waterGame)[0],lie={x:waterStone.x,y:waterStone.y};
assert.equal(R.markShot(waterGame,waterStone.id),true);
waterStone.active=false;waterStone.x=waterGame.board.water[0].x;waterStone.y=waterGame.board.water[0].y;
R.resolve(waterGame,[{type:'water',team:0,id:waterStone.id}]);
assert.equal(waterGame.phase,'aiming','water penalty continues the hole');
assert.equal(waterGame.scores[0],2,'water costs the played stroke plus one penalty stroke');
assert.equal(waterStone.active,true);
assert.deepEqual({x:waterStone.x,y:waterStone.y},lie,'water resets the stone to its previous lie');

const dogleg=R.createGame({mode:'golf',players:2,settings:{holes:9},settingsOverride:true});
dogleg.hole=3;R.setupHole(dogleg);dogleg.turn=1;
const aiStone=R.eligibleObjects(dogleg)[0],shot=AI.chooseShot(dogleg,'hard',1234),next=dogleg.board.fairwayPath[1],cup=dogleg.board.cup;
const angle=(force,target)=>Math.acos(Math.max(-1,Math.min(1,(force.x*(target.x-aiStone.x)+force.y*(target.y-aiStone.y))/(Math.hypot(force.x,force.y)*Math.hypot(target.x-aiStone.x,target.y-aiStone.y)))));
assert.ok(angle(shot.force,next)<angle(shot.force,cup),'AI follows the dogleg waypoint instead of firing straight at the cup');

const collateral=R.createGame({mode:'golf',players:2,settings:{holes:3}});
const opponent=collateral.objects.find(o=>o.team===1);opponent.x=900;opponent.y=900;const opponentLie={x:opponent.x,y:opponent.y};
assert.ok(R.markShot(collateral,collateral.objects.find(o=>o.team===0).id));
opponent.x=collateral.board.water[0].x;opponent.y=collateral.board.water[0].y;opponent.active=false;
R.resolve(collateral,[{type:'water',team:1,id:opponent.id}]);
assert.equal(opponent.active,true,'an opponent knocked into water is restored too');
assert.deepEqual({x:opponent.x,y:opponent.y},opponentLie);
assert.equal(collateral.scores[1],1,'the owner of a collateral water ball receives the penalty');

const putting=R.createGame({mode:'golf',players:2,settings:{holes:3}});putting.turn=1;
const putter=putting.objects.find(o=>o.team===1),cupTarget=putting.board.cup;
Object.assign(putter,{x:cupTarget.x-100,y:cupTarget.y,vx:0,vy:0});
const putt=AI.chooseShot(putting,'hard',1234),puttSpeed=Math.hypot(putt.force.x,putt.force.y);
assert.ok(puttSpeed<300,`a 100px putt must enter below cup capture speed, got ${puttSpeed}`);
P.applyShot(putter,putt.force);let cupEvent=false;
for(let i=0;i<360&&!cupEvent;i++)cupEvent=P.step([putter],1/120,putting.board).some(e=>e.type==='cup');
assert.equal(cupEvent,true,'AI can actually sink a short putt');

const hazardGame=R.createGame({mode:'golf',players:1,settings:{holes:9}});
for(let hole=0;hole<2;hole++){const ball=R.eligibleObjects(hazardGame)[0];R.markShot(hazardGame,ball.id);Object.assign(ball,{x:hazardGame.board.cup.x,y:hazardGame.board.cup.y,vx:0,vy:0});R.resolve(hazardGame,[{type:'cup',team:0,id:ball.id}]);}
const trapped=R.eligibleObjects(hazardGame)[0];Object.assign(trapped,{x:832,y:803,vx:0,vy:0});let waterLoops=0;
for(let seed=1;seed<=20;seed++){const shot=AI.chooseShot(hazardGame,'normal',seed),objects=hazardGame.objects.map(object=>({...object})),ball=objects.find(object=>object.id===trapped.id);P.applyShot(ball,shot.force);let entered=false;for(let frame=0;frame<2400&&!P.allResting(objects);frame++)if(P.step(objects,1/120,hazardGame.board).some(event=>event.type==='water'&&event.team===0)){entered=true;break;}if(entered)waterLoops++;}
assert.equal(waterLoops,0,`Normal AI must escape a restored lie beside water; ${waterLoops}/20 shots re-entered the hazard`);

console.log('ttak golf course tests passed');
