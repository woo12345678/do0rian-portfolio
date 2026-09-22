(() => {
  'use strict';

  const W = 1280, H = 720, TAU = Math.PI * 2;
  const Rules = window.StitchkeeperRules, MOTH = Rules.MOTH_TUNING;
  const C = { ink:'#171923', paper:'#e7ddc8', thread:'#c89b4a', rust:'#9a4f3d', blue:'#53657a', dark:'#0c0d13' };
  const PHASES = [
    { name:'초승 · FIRST HEM', tears:3, moths:2, wind:7, time:58, hue:'#53657a' },
    { name:'기운 밤 · THE FRAY', tears:4, moths:4, wind:15, time:64, hue:'#654d5d' },
    { name:'새벽 전 · LAST SEAM', tears:5, moths:6, wind:24, time:72, hue:'#705443' }
  ];
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const dist2 = (a,b,c,d) => (a-c)*(a-c)+(b-d)*(b-d);
  function hash(n){ n=Math.sin(n*127.1+311.7)*43758.5453; return n-Math.floor(n); }
  function ease(t){ return t*t*(3-2*t); }

  class AudioKeeper {
    constructor(){ this.ctx=null; this.master=null; this.muted=false; this.amb=null; }
    wake(){
      if(!this.ctx){
        const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
        this.ctx=new AC(); this.master=this.ctx.createGain(); this.master.gain.value=this.muted?0:.19; this.master.connect(this.ctx.destination);
        const b=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate), d=b.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.055;
        const s=this.ctx.createBufferSource(), f=this.ctx.createBiquadFilter(), g=this.ctx.createGain();
        s.buffer=b; s.loop=true; f.type='lowpass'; f.frequency.value=430; g.gain.value=.12; s.connect(f).connect(g).connect(this.master); s.start(); this.amb=s;
      }
      if(this.ctx.state==='suspended') this.ctx.resume();
    }
    tone(freq,dur,type='sine',vol=.12,slide=0){
      if(!this.ctx||this.muted) return; const t=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type=type; o.frequency.setValueAtTime(freq,t); o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
      g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(vol,t+.012); g.gain.exponentialRampToValueAtTime(.001,t+dur);
      o.connect(g).connect(this.master); o.start(t); o.stop(t+dur+.03);
    }
    stitch(){ this.tone(520,.09,'triangle',.1,170); }
    success(){ this.tone(390,.16,'triangle',.11,190); setTimeout(()=>this.tone(620,.25,'sine',.09,120),85); }
    fail(){ this.tone(135,.25,'sawtooth',.06,-65); }
    pulse(){ this.tone(110,.32,'sine',.14,260); }
    moth(){ this.tone(75,.12,'square',.035,-25); }
    toggle(){ this.muted=!this.muted; if(this.master) this.master.gain.setTargetAtTime(this.muted?0:.19,this.ctx.currentTime,.02); return this.muted; }
  }

  class Mark {
    constructor(){ this.life=0; this.max=1; this.x=0; this.y=0; this.vx=0; this.vy=0; this.kind=0; }
    set(x,y,vx,vy,life,kind){ this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=this.max=life;this.kind=kind;return this; }
    update(dt){ this.life-=dt; this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=.98;this.vy*=.98; }
    draw(ctx){ const a=clamp(this.life/this.max,0,1);ctx.globalAlpha=a*.8;ctx.fillStyle=this.kind?C.rust:C.thread;ctx.beginPath();ctx.arc(this.x,this.y,1.3+this.kind*1.2,0,TAU);ctx.fill();ctx.globalAlpha=1; }
  }

  class Tear {
    constructor(id,x,y,len,angle){
      this.id=id;this.x=x;this.y=y;this.len=len;this.angle=angle;this.done=false;this.flash=0;this.seed=id*29+7;
      const dx=Math.cos(angle)*len*.5,dy=Math.sin(angle)*len*.5;this.a={x:x-dx,y:y-dy};this.b={x:x+dx,y:y+dy};
      this.path=[]; for(let i=0;i<=8;i++){const t=i/8, off=(hash(this.seed+i)-.5)*16*Math.sin(t*Math.PI);this.path.push({x:lerp(this.a.x,this.b.x,t)+Math.cos(angle+Math.PI/2)*off,y:lerp(this.a.y,this.b.y,t)+Math.sin(angle+Math.PI/2)*off});}
    }
    draw(ctx,time){
      if(!this.done){
        ctx.strokeStyle='rgba(5,6,10,.93)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(this.path[0].x,this.path[0].y);for(let i=1;i<this.path.length;i++)ctx.lineTo(this.path[i].x,this.path[i].y);ctx.stroke();
        ctx.strokeStyle='rgba(231,221,200,.28)';ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.stroke();ctx.setLineDash([]);
        for(const p of [this.a,this.b]){const r=7+Math.sin(time*4+this.id)*2;ctx.strokeStyle=C.thread;ctx.globalAlpha=.65;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(p.x,p.y,2.8,0,TAU);ctx.fill();}
      } else {
        ctx.strokeStyle=C.thread;ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(this.path[0].x,this.path[0].y);for(let i=1;i<this.path.length;i++)ctx.lineTo(this.path[i].x,this.path[i].y);ctx.stroke();
        ctx.strokeStyle='rgba(231,221,200,.45)';ctx.lineWidth=1;for(let i=0;i<8;i++){const t=(i+.5)/8,x=lerp(this.a.x,this.b.x,t),y=lerp(this.a.y,this.b.y,t),nx=Math.cos(this.angle+Math.PI/2)*8,ny=Math.sin(this.angle+Math.PI/2)*8;ctx.beginPath();ctx.moveTo(x-nx,y-ny);ctx.lineTo(x+nx,y+ny);ctx.stroke();}
      }
      if(this.flash>0){ctx.globalAlpha=this.flash;ctx.strokeStyle=C.rust;ctx.lineWidth=3;ctx.beginPath();ctx.arc(this.x,this.y,30+(1-this.flash)*25,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
    }
  }

  class Moth {
    constructor(id,x,y){this.id=id;this.x=x;this.y=y;this.vx=0;this.vy=0;this.seed=id*17;this.stun=0;this.bite=0;this.phase=hash(id)*TAU;}
    update(dt,game){
      this.phase+=dt*(this.stun>0?5:13);this.stun=Math.max(0,this.stun-dt);
      const pursuing=Boolean(game.active);let tx=W*.5+Math.sin(game.time*.3+this.seed)*300,ty=H*.45+Math.cos(game.time*.4+this.seed)*180;
      if(pursuing){
        const points=game.active.points;let nearest=Infinity;
        for(let i=0;i<points.length;i++){const d2=dist2(this.x,this.y,points[i].x,points[i].y);if(d2<nearest){nearest=d2;tx=points[i].x;ty=points[i].y;}}
      }
      const dx=tx-this.x,dy=ty-this.y,d=Math.hypot(dx,dy)||1,baseAg=(pursuing?MOTH.activeAcceleration:MOTH.idleAcceleration)[game.phase],ag=baseAg*(this.stun>0?-.85:1);
      this.vx+=(dx/d*ag+Math.sin(game.time*2+this.seed)*18)*dt;this.vy+=(dy/d*ag+Math.cos(game.time*1.7+this.seed)*18)*dt;
      const sp=Math.hypot(this.vx,this.vy),cap=(pursuing?MOTH.activeMaxSpeed:MOTH.idleMaxSpeed)[game.phase];if(sp>cap){this.vx*=cap/sp;this.vy*=cap/sp;}
      this.vx*=Math.pow(.985,dt*60);this.vy*=Math.pow(.985,dt*60);this.x+=this.vx*dt;this.y+=this.vy*dt;
      if(this.x<20||this.x>W-20)this.vx*=-1;if(this.y<65||this.y>H-20)this.vy*=-1;
      this.x=clamp(this.x,15,W-15);this.y=clamp(this.y,55,H-15);
      if(game.active&&this.stun<=0&&Rules.isMothTouchingThread(this,game.active.points,MOTH.contactRadius)){this.bite+=dt;if(this.bite>MOTH.cutContactSeconds)game.cutThread(this); } else this.bite=Math.max(0,this.bite-dt*2);
    }
    draw(ctx){
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(this.vy,this.vx)+Math.PI/2);ctx.fillStyle=C.dark;ctx.strokeStyle='rgba(231,221,200,.34)';ctx.lineWidth=1;
      const flap=.48+.35*Math.sin(this.phase);ctx.beginPath();ctx.moveTo(0,-3);ctx.quadraticCurveTo(-15*flap,-15,-19*flap,2);ctx.quadraticCurveTo(-9*flap,8,-2,5);ctx.quadraticCurveTo(9*flap,8,19*flap,2);ctx.quadraticCurveTo(15*flap,-15,0,-3);ctx.fill();ctx.stroke();
      const danger=clamp(this.bite/MOTH.cutContactSeconds,0,1),warn=danger>=MOTH.dangerTelegraphRatio;ctx.fillStyle=C.rust;ctx.beginPath();ctx.ellipse(0,1,warn?3.6:2.3,warn?10:8,0,0,TAU);ctx.fill();if(warn){ctx.globalAlpha=.45+.45*Math.sin(this.phase*1.7);ctx.strokeStyle=C.rust;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,12+danger*5,0,TAU);ctx.stroke();ctx.globalAlpha=1;}ctx.restore();
    }
  }

  class InputKeeper {
    constructor(game,canvas){
      this.g=game;this.c=canvas;
      canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const p=this.pos(e);game.pointerDown(p.x,p.y);});
      canvas.addEventListener('pointermove',e=>{const p=this.pos(e);game.pointerMove(p.x,p.y);});
      canvas.addEventListener('pointerup',e=>{const p=this.pos(e);game.pointerUp(p.x,p.y);});
      canvas.addEventListener('pointercancel',()=>game.cancelSeam('놓친 실'));canvas.addEventListener('contextmenu',e=>e.preventDefault());
      window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();game.pulse();}if(e.code==='KeyP'||e.code==='Escape')game.togglePause();if(e.code==='Enter'&&game.state==='title')game.start();});
    }
    pos(e){const r=this.c.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  }

  class Game {
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.audio=new AudioKeeper();this.input=new InputKeeper(this,canvas);
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.state='title';this.phase=0;this.time=0;this.phaseTime=0;this.score=0;this.combo=0;this.integrity=3;this.thread=100;this.pulses=3;this.pulseWave=0;this.pulseCooldown=0;this.tears=[];this.moths=[];this.marks=[];this.active=null;this.pointer={x:640,y:400,down:false};this.message='';this.messageLife=0;this.shake=0;this.last=performance.now();this.high=Number(localStorage.getItem('stitchkeeper.high')||0);this.tutorial=true;
      for(let i=0;i<70;i++)this.marks.push(new Mark());this.markCursor=0;this.resize();window.addEventListener('resize',()=>this.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='play')this.pause();});requestAnimationFrame(t=>this.loop(t));
    }
    resize(){const d=Math.min(devicePixelRatio||1,2),r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));this.ctx.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);}
    announce(s){document.querySelector('#announcer').textContent=s;}
    start(){this.audio.wake();this.score=0;this.combo=0;this.integrity=3;this.thread=100;this.pulses=3;this.phase=0;this.tutorial=true;this.setupPhase();this.state='play';document.querySelector('#start').hidden=true;this.canvas.focus();this.announce('Night one. Drag between matching glowing endpoints.');}
    setupPhase(){
      const p=PHASES[this.phase];this.phaseTime=p.time;this.tears.length=0;this.moths.length=0;this.active=null;
      const spots=[[350,265],[780,225],[580,455],[970,430],[245,510],[1040,270]];
      for(let i=0;i<p.tears;i++){const s=spots[(i+this.phase)%spots.length];this.tears.push(new Tear(this.phase*10+i,s[0],s[1],135+hash(i+this.phase*9)*60,(hash(i*3+this.phase)-.5)*1.5));}
      for(let i=0;i<p.moths;i++)this.moths.push(new Moth(i+this.phase*10,80+hash(i*7+3)*1120,100+hash(i*5+8)*500));
      this.message=p.name;this.messageLife=3;
    }
    pointerDown(x,y){this.audio.wake();this.pointer.x=x;this.pointer.y=y;this.pointer.down=true;if(this.state==='title'){this.start();return;}if(this.state!=='play')return;
      let found=null,start=null;for(const t of this.tears)if(!t.done){if(dist2(x,y,t.a.x,t.a.y)<24*24){found=t;start=t.a;}else if(dist2(x,y,t.b.x,t.b.y)<24*24){found=t;start=t.b;}}
      if(found){this.active={tear:found,start,end:start===found.a?found.b:found.a,points:[{x:start.x,y:start.y},{x:start.x,y:start.y}],length:0,invalid:false};this.pointer.x=start.x;this.pointer.y=start.y;this.audio.stitch();}
      else this.pulse(x,y);
    }
    pointerMove(x,y){this.pointer.x=x;this.pointer.y=y;if(!this.active||this.state!=='play')return;const a=this.active,tip=a.points[a.points.length-1],anchor=a.points[a.points.length-2],d=Math.hypot(x-anchor.x,y-anchor.y);if(!a.invalid&&!Rules.isPointInTearCorridor({x,y},a.tear.path)){a.invalid=true;a.tear.flash=1;this.message='찢어진 틈 가까이 꿰매세요';this.messageLife=1.2;this.audio.fail();}tip.x=x;tip.y=y;if(d>4){a.length+=d;a.points.push({x,y});this.thread-=d*.012;if(this.thread<=0)this.cancelSeam('실이 다했어요');}}
    pointerUp(x,y){this.pointer.down=false;if(!this.active)return;const a=this.active;if(a.invalid)this.cancelSeam('찢어진 틈을 벗어난 실이에요');else if(dist2(x,y,a.end.x,a.end.y)<28*28)this.completeSeam();else this.cancelSeam('매듭이 닿지 않았어요');}
    completeSeam(){if(!this.active)return;if(this.active.invalid){this.cancelSeam('찢어진 틈을 벗어난 실이에요');return;}const t=this.active.tear;t.done=true;const ideal=t.len,eff=Math.max(0,1-Math.abs(this.active.length-ideal)/(ideal*1.6));this.score+=Math.round(300+eff*250+this.combo*75);this.combo++;this.thread=clamp(this.thread+18,0,100);this.active=null;this.audio.success();this.message=this.combo>1?`${this.combo} 겹 매듭 · COMBO`:'매듭이 숨을 쉽니다';this.messageLife=1.4;for(let i=0;i<18;i++)this.emit(t.x,t.y,(hash(i+t.id)-.5)*80,(hash(i*3+t.id)-.5)*80,.7,0);}
    cancelSeam(reason){if(!this.active)return;this.active.tear.flash=1;this.active=null;this.combo=0;this.thread=Math.max(0,this.thread-6);this.message=reason;this.messageLife=1.2;this.audio.fail();}
    cutThread(m){if(!this.active)return;this.cancelSeam('먹나방이 실을 끊었어요');this.integrity--;this.shake=.5;m.stun=.7;this.audio.moth();if(this.integrity<=0)this.finish(false);}
    pulse(x=this.pointer.x,y=this.pointer.y){if(this.state!=='play'||this.pulseCooldown>0||this.pulses<=0)return;this.audio.wake();this.pulses--;this.pulseCooldown=.55;this.pulseWave=1;this.pointer.x=x;this.pointer.y=y;for(const m of this.moths)if(dist2(m.x,m.y,x,y)<185*185){m.stun=2.1;const d=Math.hypot(m.x-x,m.y-y)||1;m.vx+=(m.x-x)/d*230;m.vy+=(m.y-y)/d*230;this.score+=25;}this.audio.pulse();for(let i=0;i<22;i++){const a=i/22*TAU;this.emit(x,y,Math.cos(a)*130,Math.sin(a)*130,.6,0);}}
    emit(x,y,vx,vy,life,kind){this.marks[this.markCursor++%this.marks.length].set(x,y,vx,vy,life,kind);}
    togglePause(){if(this.state==='play')this.pause();else if(this.state==='paused'){this.state='play';this.last=performance.now();this.announce('Resumed');}}
    pause(){this.state='paused';this.message='잠시, 바늘을 내려놓습니다 · PAUSED';this.messageLife=99;this.announce('Paused');}
    finish(win){this.state=win?'victory':'gameover';this.high=Math.max(this.high,this.score);localStorage.setItem('stitchkeeper.high',String(this.high));const b=document.querySelector('#start');b.hidden=false;b.textContent=win?'STITCH ANOTHER NIGHT':'TRY THE NIGHT AGAIN';this.announce(win?'Dawn restored. Victory.':'The night unraveled. Game over.');}
    setPhase(n){const phase=Number(n);if(!Number.isFinite(phase))return false;this.phase=clamp(Math.floor(phase)-1,0,2);this.setupPhase();this.state='play';document.querySelector('#start').hidden=true;return true;}
    spawnTear(){const i=this.tears.length;this.tears.push(new Tear(80+i,250+hash(i+44)*780,180+hash(i+70)*350,150,hash(i+91)*1.4-.7));}
    update(dt){
      this.time+=dt;this.messageLife=Math.max(0,this.messageLife-dt);this.pulseCooldown=Math.max(0,this.pulseCooldown-dt);this.pulseWave=Math.max(0,this.pulseWave-dt*1.8);this.shake=Math.max(0,this.shake-dt);
      for(const t of this.tears)t.flash=Math.max(0,t.flash-dt*1.8);for(const m of this.marks)if(m.life>0)m.update(dt);
      if(this.state!=='play')return;this.phaseTime-=dt;this.thread=clamp(this.thread+dt*1.35,0,100);for(const m of this.moths)m.update(dt,this);
      if(this.active&&this.active.points.length>2&&Math.random()<dt*10){const p=this.active.points[this.active.points.length-1];this.emit(p.x,p.y,(Math.random()-.5)*15,(Math.random()-.5)*15,.35,0);}
      if(this.tears.length&&this.tears.every(t=>t.done)){if(this.phase<2){this.phase++;this.pulses=Math.min(3,this.pulses+1);this.setupPhase();}else{this.finish(true);return;}}
      if(this.phaseTime<=0)this.finish(false);
    }
    loop(now){const dt=Math.min(.033,Math.max(0,(now-this.last)/1000));this.last=now;this.update(dt);this.render();requestAnimationFrame(t=>this.loop(t));}
    paper(ctx){
      ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);const hue=this.state==='title'?C.blue:PHASES[this.phase].hue;ctx.globalAlpha=.16;ctx.fillStyle=hue;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(231,221,200,.055)';ctx.lineWidth=1;for(let i=0;i<115;i++){const y=hash(i)*H,x=hash(i+300)*W,l=8+hash(i+600)*45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+l*.5,y+(hash(i+900)-.5)*4,x+l,y);ctx.stroke();}
      ctx.fillStyle='rgba(231,221,200,.22)';for(let i=0;i<90;i++)ctx.fillRect(hash(i+1200)*W,hash(i+1500)*H,hash(i+1800)*1.4+.3,.6);
      ctx.strokeStyle='rgba(231,221,200,.16)';ctx.lineWidth=1;ctx.strokeRect(14,14,W-28,H-28);ctx.strokeRect(18,17,W-36,H-35);
    }
    drawTitle(ctx){
      ctx.save();ctx.translate(640,316);ctx.strokeStyle='rgba(231,221,200,.68)';ctx.fillStyle='rgba(10,11,17,.8)';ctx.lineCap='round';
      ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-125,-70);ctx.bezierCurveTo(-70,-116,-35,-55,0,-80);ctx.bezierCurveTo(50,-115,80,-45,132,-78);ctx.lineTo(114,90);ctx.bezierCurveTo(60,68,22,112,-20,84);ctx.bezierCurveTo(-60,60,-88,103,-130,76);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=C.thread;ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(-110,-58);ctx.bezierCurveTo(-64,-84,-35,-43,1,-66);ctx.bezierCurveTo(50,-96,77,-33,116,-62);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C.paper;ctx.beginPath();ctx.moveTo(-4,-142);ctx.lineTo(5,50);ctx.lineTo(-6,84);ctx.lineTo(-9,49);ctx.closePath();ctx.fill();ctx.strokeStyle=C.thread;ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.ellipse(0,-126,3,11,0,0,TAU);ctx.stroke();
      ctx.strokeStyle='rgba(231,221,200,.32)';ctx.lineWidth=1;for(let i=0;i<17;i++){const x=-102+i*13;ctx.beginPath();ctx.moveTo(x,25+hash(i)*50);ctx.lineTo(x+30,72+hash(i+30)*20);ctx.stroke();}
      ctx.restore();
      ctx.textAlign='center';ctx.fillStyle=C.paper;ctx.font='38px Georgia, serif';ctx.fillText('THE NIGHT HAS TORN AGAIN',640,505);ctx.fillStyle=C.thread;ctx.font='16px Georgia, Noto Serif KR, serif';ctx.fillText('빛나는 두 끝을 이어, 새벽이 오기 전에 밤을 꿰매세요',640,539);ctx.fillStyle='rgba(231,221,200,.55)';ctx.font='italic 14px Georgia, serif';ctx.fillText(`kept score · ${this.high.toLocaleString()}`,640,574);
    }
    drawHud(ctx){
      ctx.textAlign='left';ctx.fillStyle='rgba(231,221,200,.78)';ctx.font='18px Georgia, serif';ctx.fillText(`NIGHT ${this.phase+1} / 3`,42,50);ctx.fillStyle=C.paper;ctx.font='30px Georgia, serif';ctx.fillText(this.score.toLocaleString(),42,82);ctx.fillStyle=C.thread;ctx.font='17px Georgia, serif';ctx.fillText(this.combo>1?`× ${this.combo} KNOT COMBO`:'SCORE',42,105);
      ctx.textAlign='center';ctx.fillStyle='rgba(231,221,200,.7)';ctx.font='17px Georgia, Noto Serif KR, serif';ctx.fillText(PHASES[this.phase].name,640,40);
      const dawn=clamp(this.phaseTime/PHASES[this.phase].time,0,1);ctx.strokeStyle='rgba(231,221,200,.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(640,75,30,Math.PI,TAU);ctx.stroke();ctx.strokeStyle=C.thread;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(640,75,30,Math.PI,Math.PI+Math.PI*(1-dawn));ctx.stroke();ctx.fillStyle=C.paper;ctx.font='18px Georgia, serif';ctx.fillText(`${Math.ceil(this.phaseTime)}s`,640,80);
      ctx.textAlign='right';ctx.fillStyle='rgba(231,221,200,.76)';ctx.font='17px Georgia, serif';ctx.fillText('THREAD',1234,50);ctx.strokeStyle='rgba(231,221,200,.35)';ctx.lineWidth=1.5;ctx.strokeRect(1054,60,180,10);ctx.fillStyle=this.thread<25?C.rust:C.thread;ctx.fillRect(1057,63,174*this.thread/100,4);ctx.fillStyle='rgba(231,221,200,.7)';ctx.font='16px Georgia, serif';ctx.fillText(`INTEGRITY  ${'●'.repeat(this.integrity)}${'○'.repeat(3-this.integrity)}`,1234,96);ctx.fillText(`THIMBLES  ${'✦'.repeat(this.pulses)}${'·'.repeat(3-this.pulses)}`,1234,121);
    }
    drawActive(ctx){if(!this.active)return;const pts=this.active.points,p=PHASES[this.phase],wind=p.wind;ctx.strokeStyle=this.active.invalid?C.rust:C.thread;ctx.lineWidth=this.active.invalid?3.4:2.8;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++){const off=Math.sin(this.time*2+i*.7)*wind*(i/pts.length)*.09;ctx.lineTo(pts[i].x,pts[i].y+off);}ctx.stroke();ctx.strokeStyle=this.active.invalid?'rgba(154,79,61,.7)':'rgba(231,221,200,.32)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(this.active.end.x,this.active.end.y,24+Math.sin(this.time*5)*4,0,TAU);ctx.stroke();}
    tutorialMarks(ctx){
      if(!this.tutorial||this.state!=='play')return;const first=this.tears.find(t=>!t.done);if(!first){this.tutorial=false;return;}
      const t=(this.time*.24)%1,x=lerp(first.a.x,first.b.x,ease(t)),y=lerp(first.a.y,first.b.y,ease(t));ctx.strokeStyle='rgba(231,221,200,.3)';ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(first.a.x,first.a.y);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();ctx.fillStyle='rgba(231,221,200,.82)';ctx.textAlign='center';ctx.font='italic 21px Georgia, Noto Serif KR, serif';ctx.fillText('균열 가까이를 따라, 빛에서 빛으로',first.x,first.y+80);
      ctx.fillStyle='rgba(231,221,200,.62)';ctx.font='17px Georgia, Noto Serif KR, serif';ctx.fillText('나방이 다가오면 톡 누르거나 SPACE',first.x,first.y+106);if(this.tears.some(q=>q.done))this.tutorial=false;
    }
    render(){
      const ctx=this.ctx;ctx.save();if(this.shake&&!this.reduced)ctx.translate((Math.random()-.5)*8*this.shake,(Math.random()-.5)*8*this.shake);this.paper(ctx);
      if(this.state==='title'){this.drawTitle(ctx);ctx.restore();return;}
      this.drawHud(ctx);for(const t of this.tears)t.draw(ctx,this.time);this.drawActive(ctx);for(const m of this.moths)m.draw(ctx);for(const m of this.marks)if(m.life>0)m.draw(ctx);
      if(this.pulseWave>0){ctx.globalAlpha=this.pulseWave*.7;ctx.strokeStyle=C.paper;ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.pointer.x,this.pointer.y,(1-this.pulseWave)*190,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      this.tutorialMarks(ctx);
      if(this.messageLife>0){ctx.textAlign='center';ctx.fillStyle=this.message.includes('끊')||this.message.includes('틈')?C.rust:C.paper;ctx.font='italic 23px Georgia, Noto Serif KR, serif';ctx.fillText(this.message,640,148);}
      if(this.state==='paused'||this.state==='gameover'||this.state==='victory'){
        ctx.fillStyle='rgba(12,13,19,.76)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle=C.thread;ctx.font='15px Georgia, Noto Serif KR, serif';ctx.fillText(this.state==='victory'?'새벽 · DAWN':this.state==='gameover'?'풀린 밤 · UNRAVELLED':'고요 · PAUSED',640,298);ctx.fillStyle=C.paper;ctx.font='42px Georgia, Noto Serif KR, serif';ctx.fillText(this.state==='victory'?'밤이 다시 온전해졌습니다':this.state==='gameover'?'밤이 먼저 풀려버렸습니다':'바늘은 잠시 쉽니다',640,357);ctx.font='17px Georgia, serif';ctx.fillStyle='rgba(231,221,200,.7)';ctx.fillText(this.state==='paused'?'P / ESC TO RETURN':`SCORE ${this.score.toLocaleString()}  ·  BEST ${this.high.toLocaleString()}`,640,397);
      }
      ctx.restore();
    }
  }

  const canvas=document.querySelector('#game'), game=new Game(canvas), mute=document.querySelector('#mute'), start=document.querySelector('#start');
  start.addEventListener('click',()=>game.start());mute.addEventListener('click',()=>{game.audio.wake();const m=game.audio.toggle();mute.textContent=m?'SOUND · OFF':'SOUND · ON';mute.setAttribute('aria-pressed',String(m));mute.setAttribute('aria-label',m?'Unmute sound':'Mute sound');canvas.focus();});
  function debugSnapshot(){
    const point=p=>Object.freeze({x:p.x,y:p.y});
    return Object.freeze({
      mode:game.state,phase:game.phase+1,score:game.score,combo:game.combo,integrity:game.integrity,
      thread:Math.round(game.thread),pulses:game.pulses,muted:game.audio.muted,
      remainingTears:game.tears.filter(t=>!t.done).length,
      activeSeamInvalid:game.active?game.active.invalid:null,
      tears:Object.freeze(game.tears.filter(t=>!t.done).map(t=>Object.freeze({a:point(t.a),b:point(t.b),path:Object.freeze(t.path.map(point))})))
    });
  }
  window.__STITCHKEEPER__=Object.freeze({
    snapshot:debugSnapshot,
    actions:Object.freeze({finishForTest:win=>{if(game.state==='play'||game.state==='paused')game.finish(Boolean(win));return debugSnapshot();}})
  });
})();
