const assert = require('node:assert/strict');
const R = require('../games/ttak-club/v1.0.3/shared/rules');

function assertClear(game, label) {
  const discs = game.objects.filter(object => object.active && object.kind === 'disc');
  for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
    const distance = Math.hypot(discs[i].x - discs[j].x, discs[i].y - discs[j].y);
    assert.ok(distance >= discs[i].radius + discs[j].radius + 1, `${label}: ${discs[i].id}/${discs[j].id} overlap by ${discs[i].radius + discs[j].radius - distance}`);
  }
}

for (const players of [1, 2, 3, 4, 5]) {
  for (const formation of ['standard', 'wedge', 'wall', 'wings']) for (let discs=1;discs<=20;discs++) {
    const classic=R.createGame({mode: 'classic', players, settings: {discs,formation}});
    assertClear(classic, `classic ${formation} p${players} d${discs}`);
    for(const object of classic.objects.filter(object=>object.kind==='disc'))assert.ok(object.x-object.radius>=270&&object.x+object.radius<=930&&object.y-object.radius>=30&&object.y+object.radius<=690,`classic ${formation} p${players} d${discs}: bounds`);
  }
  if(players>=3){
    for(let discs=1;discs<=20;discs++){
      const signatures=['standard','wedge','wall','wings'].map(formation=>R.createGame({mode:'classic',players,settings:{discs,formation}}).objects.map(object=>`${object.team}:${object.x},${object.y}`).join('|'));
      assert.equal(new Set(signatures).size,4,`classic p${players} d${discs}: all four formation choices must produce distinct layouts`);
    }
  }
  assertClear(R.createGame({mode: 'golf', players}), `golf p${players}`);
}

for (const mode of ['classic', 'royal']) {
  const game = R.createGame({mode, players: 1});
  assert.equal(R.markShot(game, game.objects.find(object => object.kind === 'disc').id), true);
  R.resolve(game, []);
  assert.equal(game.phase, 'aiming', `${mode} solo must continue while stones remain`);
  assert.equal(game.winner, null);
}
console.log(JSON.stringify({ok: true}));
