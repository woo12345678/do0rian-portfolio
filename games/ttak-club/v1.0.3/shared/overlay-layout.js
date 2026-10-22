(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TtakOverlayLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DOCKS=['top-right','top-left','bottom-right','bottom-left'];
  function overlapArea(a,b){
    return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  }
  function rectFor(dock,board,width,height,gap){
    const left=dock.endsWith('right')?board.left+board.width-width-gap:board.left+gap;
    const top=dock.startsWith('bottom')?board.top+board.height-height-gap:board.top+gap;
    return{x:left,y:top,left,top,right:left+width,bottom:top+height,width,height};
  }
  function score(rect,protectedRects){
    return protectedRects.reduce((total,protectedRect)=>total+overlapArea(rect,protectedRect)*(protectedRect.weight||1),0);
  }
  function rank(board,width,height,gap,protectedRects){
    return DOCKS.map((dock,priority)=>{const rect=rectFor(dock,board,width,height,gap);return{dock,...rect,score:score(rect,protectedRects),priority};}).sort((a,b)=>a.score-b.score||a.priority-b.priority);
  }
  function chooseDock({board,overlay,protectedRects=[],previousDock=null,gap=10,compactScale=.72,hysteresisRatio=.08}){
    const full=rank(board,overlay.width,overlay.height,gap,protectedRects),best=full[0],previous=full.find(candidate=>candidate.dock===previousDock),threshold=overlay.width*overlay.height*hysteresisRatio;
    if(best.score===0&&previous?.score===0)return{...previous,compact:false};
    if(previous&&previous.score<=best.score+threshold&&previous.score===0)return{...previous,compact:false};
    if(best.score===0)return{...best,compact:false};
    const width=Math.round(overlay.width*compactScale),height=Math.round(overlay.height*compactScale),compact=rank(board,width,height,gap,protectedRects)[0];
    return{...compact,compact:true};
  }
  return Object.freeze({chooseDock,overlapArea});
});
