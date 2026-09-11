(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TtakPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_SPEED = 1500, REST_SPEED = 5, DEFAULT_FRICTION = 1.65, RESTITUTION = 0.82;
  const body = (o = {}) => ({ id: o.id, kind: o.kind || 'disc', team: o.team ?? null, x: o.x || 0, y: o.y || 0,
    vx: o.vx || 0, vy: o.vy || 0, radius: o.radius || 24, mass: o.mass || 1, active: o.active !== false,
    friction: o.friction, heavy: !!o.heavy, number: o.number });
  function applyShot(o, force) {
    const m = Math.hypot(force.x, force.y) || 1, speed = Math.min(MAX_SPEED, m);
    o.vx = force.x / m * speed; o.vy = force.y / m * speed;
  }
  const eventKey = e => [e.type,e.id,e.side,e.number,e.team].map(value=>value??'').join('|');
  function accumulateEvents(pending=[],events=[]){const keys=new Set(pending.map(eventKey));for(const event of events){const key=eventKey(event);if(!keys.has(key)){pending.push(event);keys.add(key);}}return pending;}
  function consumeEvents(state){const events=state.pendingEvents||[];state.pendingEvents=[];return events;}
  function collide(a, b, events) {
    const dx = b.x - a.x, dy = b.y - a.y, min = a.radius + b.radius, d = Math.hypot(dx, dy);
    if (d >= min || d === 0) return;
    const nx = dx / d, ny = dy / d, overlap = min - d, total = a.mass + b.mass;
    a.x -= nx * overlap * b.mass / total; a.y -= ny * overlap * b.mass / total;
    b.x += nx * overlap * a.mass / total; b.y += ny * overlap * a.mass / total;
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel < 0) {
      const impulse = -(1 + RESTITUTION) * rel / (1 / a.mass + 1 / b.mass);
      a.vx -= impulse * nx / a.mass; a.vy -= impulse * ny / a.mass;
      b.vx += impulse * nx / b.mass; b.vy += impulse * ny / b.mass;
      events.push({ type: b.kind === 'target' ? 'target' : a.kind === 'target' ? 'target' : 'impact', id: b.kind === 'target' ? b.id : a.kind === 'target' ? a.id : undefined, number: b.number || a.number, team: a.team ?? b.team, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, strength: Math.abs(rel) });
    }
  }
  function step(objects, dt, board) {
    const events = [], walls = board.walls !== false, open = board.openEdges || {}, inset = board.inset || 0;
    const bounds = board.playfield || {x:inset,y:inset,w:board.width-inset*2,h:board.height-inset*2};
    const left=bounds.x,right=bounds.x+bounds.w,top=bounds.y,bottom=bounds.y+bounds.h;
    const emit = event => accumulateEvents(events,[event]);
    const constrain = o => {
      if (!o.active) return;
      if (walls) {
        if (open.left ? o.x + o.radius <= left : o.x - o.radius < left) { if(open.left){o.active=false;o.vx=o.vy=0;emit({type:'out',id:o.id,team:o.team});return;} o.x = left + o.radius; o.vx = Math.abs(o.vx) * RESTITUTION; }
        if (open.right ? o.x - o.radius >= right : o.x + o.radius > right) { if(open.right){o.active=false;o.vx=o.vy=0;emit({type:'out',id:o.id,team:o.team});return;} o.x = right - o.radius; o.vx = -Math.abs(o.vx) * RESTITUTION; }
        const goalMouth = board.goals && o.kind === 'ball' && o.x > board.goals.x1 && o.x < board.goals.x2;
        if (open.top ? o.y + o.radius <= top : o.y - o.radius < top) {
          if(open.top){o.active=false;o.vx=o.vy=0;emit({type:'out',id:o.id,team:o.team});return;}
          if (goalMouth) emit({ type: 'goal', side: 'top', id: o.id });
          else { o.y = top + o.radius; o.vy = Math.abs(o.vy) * RESTITUTION; }
        }
        if (open.bottom ? o.y - o.radius >= bottom : o.y + o.radius > bottom) {
          if(open.bottom){o.active=false;o.vx=o.vy=0;emit({type:'out',id:o.id,team:o.team});return;}
          if (goalMouth) emit({ type: 'goal', side: 'bottom', id: o.id });
          else { o.y = bottom - o.radius; o.vy = -Math.abs(o.vy) * RESTITUTION; }
        }
      } else if (o.x + o.radius <= left || o.x - o.radius >= right || o.y + o.radius <= top || o.y - o.radius >= bottom) {
        o.active = false; o.vx = o.vy = 0; emit({ type: 'out', id: o.id, team: o.team });
      }
      if (o.active && board.cup && o.kind === 'disc' && Math.hypot(o.x - board.cup.x, o.y - board.cup.y) < board.cup.r && Math.hypot(o.vx, o.vy) < 300) {
        o.active = false; o.vx = o.vy = 0; emit({ type: 'cup', id: o.id, team: o.team });
      }
    };
    for (const o of objects) if (o.active) {
      o.x += o.vx * dt; o.y += o.vy * dt;
      const inRough = board.rough && board.rough.some(z => o.x > z.x && o.x < z.x + z.w && o.y > z.y && o.y < z.y + z.h);
      const inBunker = board.bunkers && board.bunkers.some(z => ((o.x-z.x)/z.rx)**2+((o.y-z.y)/z.ry)**2<1);
      const decay = Math.exp(-(o.friction ?? (inBunker ? 6.2 : inRough ? 4.2 : board.friction) ?? DEFAULT_FRICTION) * dt);
      o.vx *= decay; o.vy *= decay;
      if (Math.hypot(o.vx, o.vy) < REST_SPEED) o.vx = o.vy = 0;
      constrain(o);
    }
    const active = objects.filter(o => o.active);
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) collide(active[i], active[j], events);
    for (const o of objects) constrain(o);
    return events;
  }
  const allResting = objects => objects.filter(o => o.active).every(o => Math.hypot(o.vx, o.vy) < REST_SPEED);
  return { MAX_SPEED, REST_SPEED, body, applyShot, step, allResting, accumulateEvents, consumeEvents };
});
