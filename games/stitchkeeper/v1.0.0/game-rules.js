(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.StitchkeeperRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TEAR_CORRIDOR_RADIUS = 70;
  const MOTH_TUNING = Object.freeze({
    idleAcceleration: Object.freeze([25, 32, 39]),
    idleMaxSpeed: Object.freeze([58, 68, 78]),
    activeAcceleration: Object.freeze([125, 160, 195]),
    activeMaxSpeed: Object.freeze([170, 205, 240]),
    contactRadius: 28,
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
  return Object.freeze({TEAR_CORRIDOR_RADIUS,MOTH_TUNING,pointToSegmentDistance,pointToPolylineDistance,isPointInTearCorridor,isMothTouchingThread});
});
