const assert=require('node:assert/strict');
const Layout=require('../games/ttak-club/v1.0.3/shared/overlay-layout');

const board={left:20,top:30,width:600,height:360};
const overlay={width:180,height:104};
const choose=(protectedRects=[],previousDock=null)=>Layout.chooseDock({board,overlay,protectedRects,previousDock,gap:10,compactScale:.72,hysteresisRatio:.08});

const defaultDock=choose();
assert.equal(defaultDock.dock,'top-right','the minimap keeps its familiar corner when nothing important is nearby');
assert.deepEqual({x:defaultDock.x,y:defaultDock.y},{x:430,y:40},'the overlay docks inside the rendered board, not the outer wrapper');
assert.equal(defaultDock.compact,false);

const topRightBlocked=choose([{left:405,top:25,right:625,bottom:165,weight:8}]);
assert.equal(topRightBlocked.dock,'top-left','a cup or stone under the default minimap moves it to a safe corner');
assert.equal(topRightBlocked.score,0,'the selected corner has no protected overlap');

const stable=choose([], 'bottom-left');
assert.equal(stable.dock,'bottom-left','a safe current dock is retained to prevent corner flicker');

const everyCornerBlocked=choose([
  {left:15,top:25,right:235,bottom:170,weight:8},
  {left:405,top:25,right:625,bottom:170,weight:8},
  {left:15,top:245,right:235,bottom:395,weight:8},
  {left:405,top:245,right:625,bottom:395,weight:8},
]);
assert.equal(everyCornerBlocked.compact,true,'the map shrinks when every full-size dock conflicts');
assert.ok(everyCornerBlocked.width<overlay.width&&everyCornerBlocked.height<overlay.height);

const overlap=Layout.overlapArea({left:0,top:0,right:100,bottom:100},{left:80,top:70,right:130,bottom:120});
assert.equal(overlap,600,'overlap scoring uses real intersection area');

console.log('ttak golf minimap avoidance tests passed');
