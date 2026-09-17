const assert=require('node:assert/strict');
const R=require('../games/ttak-club/v1.0.3/shared/rules');
const P=require('../games/ttak-club/v1.0.3/shared/physics');
const AI=require('../games/ttak-club/v1.0.3/shared/ai');

function result(difficulty,team,seed){
  const game=R.createGame({mode:'line',players:5,settings:{throws:1,lineLayout:'h-close'}});
  game.turn=team;
  const shot=AI.chooseShot(game,difficulty,seed);
  const disc=game.objects.find(object=>object.id===shot.id);
  P.applyShot(disc,shot.force);
  for(let step=0;step<20000&&!P.allResting(game.objects);step++)P.step(game.objects,1/120,game.board);
  const measure=R.lineMeasure(game.board.targetLine,disc);
  return{legal:measure.legal,distance:+measure.distance.toFixed(1)};
}

for(const difficulty of ['easy','normal','hard']){
  const round=Array.from({length:4},(_,index)=>result(difficulty,index+1,1001+index));
  assert(round.every(item=>item.legal),`${difficulty}: AI stones must stop on the legal side`);
  assert(round.every(item=>item.distance>=5&&item.distance<=80),`${difficulty}: variance must remain believable and bounded`);
  assert(new Set(round.map(item=>item.distance)).size>=3,`${difficulty}: four AI players must not post the same robotic score`);
}

const means={};
for(const difficulty of ['easy','normal','hard']){
  const samples=Array.from({length:40},(_,index)=>result(difficulty,index%4+1,7000+index));
  means[difficulty]=samples.reduce((sum,item)=>sum+item.distance,0)/samples.length;
}
assert(means.hard<means.normal&&means.normal<means.easy,`difficulty should improve line accuracy: ${JSON.stringify(means)}`);

const teamMeans=[];
for(let team=1;team<5;team++){
  const samples=Array.from({length:120},(_,index)=>result('normal',team,19000+index));
  teamMeans.push(samples.reduce((sum,item)=>sum+item.distance,0)/samples.length);
}
assert(Math.max(...teamMeans)-Math.min(...teamMeans)<1.5,`player slots must share the same accuracy distribution: ${JSON.stringify(teamMeans)}`);
console.log(JSON.stringify({ok:true,means,teamMeans}));
