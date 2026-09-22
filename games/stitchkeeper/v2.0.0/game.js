(() => {
  'use strict';

  const W=1280,H=720,TAU=Math.PI*2,Rules=window.StitchkeeperRules;
  const C={ink:'#171923',paper:'#e7ddc8',thread:'#c89b4a',rust:'#9a4f3d',blue:'#53657a',dark:'#0c0d13'};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const distanceSquared=(a,b,c,d)=>(a-c)*(a-c)+(b-d)*(b-d);
  const textureHash=(value)=>{const result=Math.sin(value*127.1+311.7)*43758.5453;return result-Math.floor(result);};

  class AudioKeeper {
    constructor(){this.context=null;this.master=null;this.muted=false;}
    wake(){
      if(!this.context){
        const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
        this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.18;this.master.connect(this.context.destination);
        const buffer=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.045;
        const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
        source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=410;gain.gain.value=.11;source.connect(filter).connect(gain).connect(this.master);source.start();
      }
      if(this.context.state==='suspended')this.context.resume();
    }
    tone(frequency,duration,type='sine',volume=.1,slide=0){
      if(!this.context||this.muted)return;const now=this.context.currentTime,oscillator=this.context.createOscillator(),gain=this.context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,frequency+slide),now+duration);
      gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.012);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      oscillator.connect(gain).connect(this.master);oscillator.start(now);oscillator.stop(now+duration+.03);
    }
    stitch(){this.tone(520,.09,'triangle',.1,170);} success(){this.tone(390,.16,'triangle',.11,190);setTimeout(()=>this.tone(620,.22,'sine',.08,120),85);}
    fail(){this.tone(135,.25,'sawtooth',.06,-65);} pulse(){this.tone(110,.32,'sine',.14,260);} moth(){this.tone(75,.12,'square',.035,-25);}
    toggle(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.18,this.context.currentTime,.02);return this.muted;}
  }

  class Mark {
    constructor(){this.life=0;}
    set(x,y,vx,vy,life,kind){Object.assign(this,{x,y,vx,vy,life,max:life,kind});return this;}
    update(dt){this.life-=dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=.98;this.vy*=.98;}
    draw(ctx){const alpha=clamp(this.life/this.max,0,1);ctx.globalAlpha=alpha*.8;ctx.fillStyle=this.kind?C.rust:C.thread;ctx.beginPath();ctx.arc(this.x,this.y,1.3+this.kind*1.2,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  }

  class Tear {
    constructor(spec){this.id=spec.id;this.x=spec.x;this.y=spec.y;this.len=spec.length;this.angle=spec.angle;this.a={...spec.a};this.b={...spec.b};this.path=spec.path.map(point=>({...point}));this.done=false;this.flash=0;}
    draw(ctx,time){
      if(!this.done){
        ctx.strokeStyle='rgba(5,6,10,.93)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(this.path[0].x,this.path[0].y);for(const point of this.path.slice(1))ctx.lineTo(point.x,point.y);ctx.stroke();
        ctx.strokeStyle='rgba(231,221,200,.28)';ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.stroke();ctx.setLineDash([]);
        for(const point of [this.a,this.b]){const radius=7+Math.sin(time*4+this.id)*2;ctx.strokeStyle=C.thread;ctx.globalAlpha=.65;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(point.x,point.y,radius,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(point.x,point.y,2.8,0,TAU);ctx.fill();}
      }else{
        ctx.strokeStyle=C.thread;ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(this.path[0].x,this.path[0].y);for(const point of this.path.slice(1))ctx.lineTo(point.x,point.y);ctx.stroke();
        ctx.strokeStyle='rgba(231,221,200,.45)';ctx.lineWidth=1;for(let i=0;i<8;i++){const t=(i+.5)/8,x=lerp(this.a.x,this.b.x,t),y=lerp(this.a.y,this.b.y,t),nx=Math.cos(this.angle+Math.PI/2)*8,ny=Math.sin(this.angle+Math.PI/2)*8;ctx.beginPath();ctx.moveTo(x-nx,y-ny);ctx.lineTo(x+nx,y+ny);ctx.stroke();}
      }
      if(this.flash>0){ctx.globalAlpha=this.flash;ctx.strokeStyle=C.rust;ctx.lineWidth=3;ctx.beginPath();ctx.arc(this.x,this.y,30+(1-this.flash)*25,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
    }
  }

  class Moth {
    constructor(id,x,y){this.id=id;this.x=x;this.y=y;this.vx=0;this.vy=0;this.seed=id*17;this.stun=0;this.bite=0;this.phase=textureHash(id)*TAU;this.reactionRemaining=0;}
    beginReaction(delay){this.reactionRemaining=delay;}
    update(dt,game){
      this.phase+=dt*(this.stun>0?5:13);this.stun=Math.max(0,this.stun-dt);
      if(game.active)this.reactionRemaining=Math.max(0,this.reactionRemaining-dt);else this.reactionRemaining=game.profile.reactionDelay;
      const pursuing=Boolean(game.active)&&this.reactionRemaining<=0;let targetX=W*.5+Math.sin(game.elapsed*.3+this.seed)*300,targetY=H*.45+Math.cos(game.elapsed*.4+this.seed)*180;
      if(pursuing){let nearest=Infinity;for(const point of game.active.points){const distance=distanceSquared(this.x,this.y,point.x,point.y);if(distance<nearest){nearest=distance;targetX=point.x;targetY=point.y;}}}
      const tuning=game.effectiveTuning(),dx=targetX-this.x,dy=targetY-this.y,distance=Math.hypot(dx,dy)||1,acceleration=(pursuing?tuning.activeAcceleration:tuning.idleAcceleration)*(this.stun>0?-.85:1);
      this.vx+=(dx/distance*acceleration+Math.sin(game.elapsed*2+this.seed)*18)*dt;this.vy+=(dy/distance*acceleration+Math.cos(game.elapsed*1.7+this.seed)*18)*dt;
      const speed=Math.hypot(this.vx,this.vy),cap=pursuing?tuning.activeSpeed:tuning.idleSpeed;if(speed>cap){this.vx*=cap/speed;this.vy*=cap/speed;}
      this.vx*=Math.pow(.985,dt*60);this.vy*=Math.pow(.985,dt*60);this.x+=this.vx*dt;this.y+=this.vy*dt;
      if(this.x<20||this.x>W-20)this.vx*=-1;if(this.y<110||this.y>H-20)this.vy*=-1;this.x=clamp(this.x,15,W-15);this.y=clamp(this.y,105,H-15);
      if(game.active&&this.stun<=0&&Rules.isMothTouchingThread(this,game.active.points,Rules.MOTH_CONTACT_RADIUS)){this.bite+=dt;if(this.bite>game.profile.cutContactSeconds)game.cutThread(this);}else this.bite=Math.max(0,this.bite-dt*2);
    }
    draw(ctx,cutTime){
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(this.vy,this.vx)+Math.PI/2);ctx.fillStyle=C.dark;ctx.strokeStyle='rgba(231,221,200,.34)';ctx.lineWidth=1;
      const flap=.48+.35*Math.sin(this.phase);ctx.beginPath();ctx.moveTo(0,-3);ctx.quadraticCurveTo(-15*flap,-15,-19*flap,2);ctx.quadraticCurveTo(-9*flap,8,-2,5);ctx.quadraticCurveTo(9*flap,8,19*flap,2);ctx.quadraticCurveTo(15*flap,-15,0,-3);ctx.fill();ctx.stroke();
      const danger=clamp(this.bite/cutTime,0,1),warning=danger>=.55;ctx.fillStyle=C.rust;ctx.beginPath();ctx.ellipse(0,1,warning?3.6:2.3,warning?10:8,0,0,TAU);ctx.fill();if(warning){ctx.globalAlpha=.45+.45*Math.sin(this.phase*1.7);ctx.strokeStyle=C.rust;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,12+danger*5,0,TAU);ctx.stroke();ctx.globalAlpha=1;}ctx.restore();
    }
  }

  class InputKeeper {
    constructor(game,canvas){
      this.game=game;this.canvas=canvas;
      canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);const point=this.position(event);game.pointerDown(point.x,point.y);});
      canvas.addEventListener('pointermove',event=>{const point=this.position(event);game.pointerMove(point.x,point.y);});
      canvas.addEventListener('pointerup',event=>{const point=this.position(event);game.pointerUp(point.x,point.y);});
      canvas.addEventListener('pointercancel',()=>game.cancelSeam('실이 끊겼어요'));canvas.addEventListener('contextmenu',event=>event.preventDefault());
      window.addEventListener('keydown',event=>{if(event.code==='Space'){event.preventDefault();game.pulse();}if(event.code==='KeyP'||event.code==='Escape')game.togglePause();const interactive=event.target instanceof Element&&event.target.closest('button,a,input,select,textarea,[role="button"]');if(event.code==='Enter'&&!interactive&&['title','gameover','victory'].includes(game.state)){event.preventDefault();game.start();}});
    }
    position(event){const bounds=this.canvas.getBoundingClientRect();return{x:(event.clientX-bounds.left)/bounds.width*W,y:(event.clientY-bounds.top)/bounds.height*H};}
  }

  class Game {
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.audio=new AudioKeeper();this.input=new InputKeeper(this,canvas);this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.state='title';this.selectedDifficultyId=Rules.DEFAULT_DIFFICULTY_ID;this.profile=Rules.DIFFICULTY_PROFILES[this.selectedDifficultyId];this.nightIndex=0;this.runSeed='------';this.runPlan=[];this.elapsed=0;this.nightTime=0;this.score=0;this.combo=0;this.integrity=3;this.thread=100;this.pulses=3;this.pulseWave=0;this.pulseCooldown=0;this.tears=[];this.moths=[];this.marks=[];this.active=null;this.pointer={x:640,y:400,down:false};this.message='';this.messageLife=0;this.shake=0;this.last=performance.now();this.tutorial=true;
      for(let i=0;i<70;i++)this.marks.push(new Mark());this.markCursor=0;this.resize();window.addEventListener('resize',()=>this.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='play')this.pause();});requestAnimationFrame(time=>this.loop(time));
    }
    get night(){return Rules.CAMPAIGN_NIGHTS[this.nightIndex];}
    get selection(){return this.runPlan[this.nightIndex]||null;}
    highScore(){return Number(localStorage.getItem(`stitchkeeper.high.${this.selectedDifficultyId}`)||0);}
    effectiveTuning(){const scale=1+this.nightIndex*.035;return{idleSpeed:Math.round(this.profile.idleSpeed*scale),activeSpeed:Math.round(this.profile.activeSpeed*scale),idleAcceleration:Math.round(this.profile.idleAcceleration*scale),activeAcceleration:Math.round(this.profile.activeAcceleration*scale),reactionDelay:this.profile.reactionDelay,cutContactSeconds:this.profile.cutContactSeconds,pulseStunSeconds:this.profile.pulseStunSeconds};}
    resize(){const density=Math.min(devicePixelRatio||1,2),bounds=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.round(bounds.width*density));this.canvas.height=Math.max(1,Math.round(bounds.height*density));this.ctx.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);}
    announce(text){document.querySelector('#announcer').textContent=text;}
    setDifficulty(id){if(!Rules.DIFFICULTY_PROFILES[id]||this.state==='play'||this.state==='paused')return false;this.selectedDifficultyId=id;this.profile=Rules.DIFFICULTY_PROFILES[id];return true;}
    freshSeed(){const values=new Uint32Array(1);if(window.crypto&&window.crypto.getRandomValues)window.crypto.getRandomValues(values);else values[0]=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;return values[0].toString(36).toUpperCase().padStart(6,'0').slice(-6);}
    start(){
      this.audio.wake();this.profile=Rules.DIFFICULTY_PROFILES[this.selectedDifficultyId];this.runSeed=this.freshSeed();this.runPlan=Rules.createRunPlan(this.runSeed);this.score=0;this.combo=0;this.integrity=3;this.thread=100;this.pulses=3;this.nightIndex=0;this.tutorial=true;this.setupNight();this.state='play';setSelectionVisibility(false);this.canvas.focus();this.announce(`${this.profile.labelKo}. Night one of twelve.`);
    }
    setupNight(){
      const night=this.night,selection=this.selection;this.nightTime=night.timeSeconds;this.tears=Rules.generateTearSpecs(selection.patternId,selection.layoutSeed,night.tears).map(spec=>new Tear(spec));this.moths=[];this.active=null;
      const count=Math.max(1,Math.round(night.moths*this.profile.mothScale)),random=Rules.seededRandom(`${this.runSeed}:moths:${this.nightIndex}`);
      for(let i=0;i<count;i++)this.moths.push(new Moth(i+this.nightIndex*20,90+random()*1100,145+random()*465));
      this.message=`${night.titleKo} · ${night.titleEn}`;this.messageLife=3;
    }
    pointerDown(x,y){
      this.audio.wake();this.pointer={x,y,down:true};if(this.state!=='play')return;let found=null,start=null;
      for(const tear of this.tears)if(!tear.done){if(distanceSquared(x,y,tear.a.x,tear.a.y)<24*24){found=tear;start=tear.a;}else if(distanceSquared(x,y,tear.b.x,tear.b.y)<24*24){found=tear;start=tear.b;}}
      if(found){this.active={tear:found,start,end:start===found.a?found.b:found.a,points:[{...start},{...start}],length:0,invalid:false};for(const moth of this.moths)moth.beginReaction(this.profile.reactionDelay);this.pointer.x=start.x;this.pointer.y=start.y;this.audio.stitch();}else this.pulse(x,y);
    }
    pointerMove(x,y){
      this.pointer.x=x;this.pointer.y=y;if(!this.active||this.state!=='play')return;const active=this.active,tip=active.points[active.points.length-1],anchor=active.points[active.points.length-2],distance=Math.hypot(x-anchor.x,y-anchor.y);
      if(!active.invalid&&!Rules.isPointInTearCorridor({x,y},active.tear.path)){active.invalid=true;active.tear.flash=1;this.message='찢어진 선 가까이 꿰매세요';this.messageLife=1.2;this.audio.fail();}
      tip.x=x;tip.y=y;if(distance>4){active.length+=distance;active.points.push({x,y});this.thread-=distance*.012;if(this.thread<=0)this.cancelSeam('실이 다 풀렸어요');}
    }
    pointerUp(x,y){this.pointer.down=false;if(!this.active)return;const active=this.active;if(active.invalid)this.cancelSeam('찢어진 선을 벗어난 실이에요');else if(distanceSquared(x,y,active.end.x,active.end.y)<28*28)this.completeSeam();else this.cancelSeam('매듭에 닿지 않았어요');}
    completeSeam(){
      if(!this.active)return;if(this.active.invalid){this.cancelSeam('찢어진 선을 벗어난 실이에요');return;}const tear=this.active.tear;tear.done=true;const efficiency=Math.max(0,1-Math.abs(this.active.length-tear.len)/(tear.len*1.6)),base=Math.round(300+efficiency*250+this.combo*75);this.score+=Math.round(base*this.profile.scoreMultiplier);this.combo++;this.thread=clamp(this.thread+18,0,100);this.active=null;this.audio.success();this.message=this.combo>1?`${this.combo}겹 매듭 · COMBO`:'매듭을 지었습니다';this.messageLife=1.4;for(let i=0;i<18;i++)this.emit(tear.x,tear.y,(textureHash(i+tear.id)-.5)*80,(textureHash(i*3+tear.id)-.5)*80,.7,0);
    }
    cancelSeam(reason){if(!this.active)return;this.active.tear.flash=1;this.active=null;this.combo=0;this.thread=Math.max(0,this.thread-6);this.message=reason;this.messageLife=1.2;this.audio.fail();}
    cutThread(moth){if(!this.active)return;this.cancelSeam('먹나방이 실을 끊었어요');this.integrity--;this.shake=.5;moth.stun=.7;this.audio.moth();if(this.integrity<=0)this.finish(false);}
    pulse(x=this.pointer.x,y=this.pointer.y){if(this.state!=='play'||this.pulseCooldown>0||this.pulses<=0)return;this.audio.wake();this.pulses--;this.pulseCooldown=.55;this.pulseWave=1;this.pointer.x=x;this.pointer.y=y;for(const moth of this.moths)if(distanceSquared(moth.x,moth.y,x,y)<185*185){moth.stun=this.profile.pulseStunSeconds;const distance=Math.hypot(moth.x-x,moth.y-y)||1;moth.vx+=(moth.x-x)/distance*230;moth.vy+=(moth.y-y)/distance*230;this.score+=Math.round(25*this.profile.scoreMultiplier);}this.audio.pulse();for(let i=0;i<22;i++){const angle=i/22*TAU;this.emit(x,y,Math.cos(angle)*130,Math.sin(angle)*130,.6,0);}}
    emit(x,y,vx,vy,life,kind){this.marks[this.markCursor++%this.marks.length].set(x,y,vx,vy,life,kind);}
    togglePause(){if(this.state==='play')this.pause();else if(this.state==='paused'){this.state='play';this.last=performance.now();this.messageLife=0;this.announce('Resumed');}}
    pause(){this.state='paused';this.message='고요 · PAUSED';this.messageLife=99;this.announce('Paused');}
    finish(win){this.state=win?'victory':'gameover';const high=Math.max(this.highScore(),this.score);localStorage.setItem(`stitchkeeper.high.${this.selectedDifficultyId}`,String(high));setSelectionVisibility(true,win?'STITCH ANOTHER RUN':'TRY THE NIGHT AGAIN');this.announce(win?'Dawn restored. Victory.':'The night unraveled. Game over.');}
    advanceNight(){if(this.nightIndex<Rules.TOTAL_NIGHTS-1){this.nightIndex++;this.pulses=Math.min(3,this.pulses+1);this.setupNight();this.announce(`Night ${this.nightIndex+1} of twelve.`);}else this.finish(true);}
    update(dt){
      this.elapsed+=dt;this.messageLife=Math.max(0,this.messageLife-dt);this.pulseCooldown=Math.max(0,this.pulseCooldown-dt);this.pulseWave=Math.max(0,this.pulseWave-dt*1.8);this.shake=Math.max(0,this.shake-dt);for(const tear of this.tears)tear.flash=Math.max(0,tear.flash-dt*1.8);for(const mark of this.marks)if(mark.life>0)mark.update(dt);
      if(this.state!=='play')return;this.nightTime-=dt;this.thread=clamp(this.thread+dt*1.35,0,100);for(const moth of this.moths)moth.update(dt,this);
      if(this.active&&this.active.points.length>2&&Math.random()<dt*10){const point=this.active.points[this.active.points.length-1];this.emit(point.x,point.y,(Math.random()-.5)*15,(Math.random()-.5)*15,.35,0);}
      if(this.tears.length&&this.tears.every(tear=>tear.done)){this.advanceNight();return;}if(this.nightTime<=0)this.finish(false);
    }
    loop(now){const dt=Math.min(.033,Math.max(0,(now-this.last)/1000));this.last=now;this.update(dt);this.render();requestAnimationFrame(time=>this.loop(time));}
    paper(ctx){
      ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);const hue=this.state==='title'?C.blue:this.night.hue;ctx.globalAlpha=.16;ctx.fillStyle=hue;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.strokeStyle='rgba(231,221,200,.055)';ctx.lineWidth=1;
      for(let i=0;i<115;i++){const y=textureHash(i)*H,x=textureHash(i+300)*W,length=8+textureHash(i+600)*45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+length*.5,y+(textureHash(i+900)-.5)*4,x+length,y);ctx.stroke();}
      ctx.fillStyle='rgba(231,221,200,.22)';for(let i=0;i<90;i++)ctx.fillRect(textureHash(i+1200)*W,textureHash(i+1500)*H,textureHash(i+1800)*1.4+.3,.6);ctx.strokeStyle='rgba(231,221,200,.16)';ctx.lineWidth=1;ctx.strokeRect(14,14,W-28,H-28);ctx.strokeRect(18,17,W-36,H-35);
    }
    drawTitle(ctx){
      ctx.save();ctx.translate(640,272);ctx.strokeStyle='rgba(231,221,200,.68)';ctx.fillStyle='rgba(10,11,17,.8)';ctx.lineCap='round';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-125,-70);ctx.bezierCurveTo(-70,-116,-35,-55,0,-80);ctx.bezierCurveTo(50,-115,80,-45,132,-78);ctx.lineTo(114,90);ctx.bezierCurveTo(60,68,22,112,-20,84);ctx.bezierCurveTo(-60,60,-88,103,-130,76);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=C.thread;ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(-110,-58);ctx.bezierCurveTo(-64,-84,-35,-43,1,-66);ctx.bezierCurveTo(50,-96,77,-33,116,-62);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=C.paper;ctx.beginPath();ctx.moveTo(-4,-142);ctx.lineTo(5,50);ctx.lineTo(-6,84);ctx.lineTo(-9,49);ctx.closePath();ctx.fill();ctx.strokeStyle=C.thread;ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.ellipse(0,-126,3,11,0,0,TAU);ctx.stroke();ctx.restore();ctx.textAlign='center';ctx.fillStyle=C.paper;ctx.font='34px Georgia, serif';ctx.fillText('THE NIGHT HAS TORN AGAIN',640,444);ctx.fillStyle=C.thread;ctx.font='16px Georgia, Noto Serif KR, serif';ctx.fillText('빛나는 두 끝을 이어, 새벽이 오기 전에 밤을 꿰매세요',640,476);ctx.fillStyle='rgba(231,221,200,.55)';ctx.font='italic 13px Georgia, serif';ctx.fillText('twelve shifting nights · hundreds of possible seams',640,503);
    }
    drawHud(ctx){
      const selection=this.selection,night=this.night;ctx.textAlign='left';ctx.fillStyle='rgba(231,221,200,.78)';ctx.font='18px Georgia, serif';ctx.fillText(`NIGHT ${this.nightIndex+1} / ${Rules.TOTAL_NIGHTS}`,42,48);ctx.fillStyle=C.paper;ctx.font='29px Georgia, serif';ctx.fillText(this.score.toLocaleString(),42,80);ctx.fillStyle=C.thread;ctx.font='14px Georgia, Noto Serif KR, serif';ctx.fillText(`${this.profile.labelKo} · BEST ${this.highScore().toLocaleString()}`,42,104);
      ctx.textAlign='center';ctx.fillStyle='rgba(231,221,200,.76)';ctx.font='17px Georgia, Noto Serif KR, serif';ctx.fillText(`${night.titleKo} · ${night.titleEn}`,640,38);ctx.fillStyle=C.thread;ctx.font='13px Georgia, Noto Serif KR, serif';ctx.fillText(`${selection.patternNameKo} · ${selection.patternNameEn}  /  SEED ${this.runSeed}`,640,61);const remaining=clamp(this.nightTime/night.timeSeconds,0,1);ctx.strokeStyle='rgba(231,221,200,.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(640,91,24,Math.PI,TAU);ctx.stroke();ctx.strokeStyle=C.thread;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(640,91,24,Math.PI,Math.PI+Math.PI*(1-remaining));ctx.stroke();ctx.fillStyle=C.paper;ctx.font='15px Georgia, serif';ctx.fillText(`${Math.ceil(this.nightTime)}s`,640,96);
      ctx.textAlign='right';ctx.fillStyle='rgba(231,221,200,.76)';ctx.font='16px Georgia, serif';ctx.fillText('THREAD',1234,48);ctx.strokeStyle='rgba(231,221,200,.35)';ctx.strokeRect(1054,58,180,10);ctx.fillStyle=this.thread<25?C.rust:C.thread;ctx.fillRect(1057,61,174*this.thread/100,4);ctx.fillStyle='rgba(231,221,200,.7)';ctx.font='15px Georgia, serif';ctx.fillText(`INTEGRITY  ${'◆'.repeat(this.integrity)}${'◇'.repeat(3-this.integrity)}`,1234,91);ctx.fillText(`THIMBLES  ${'●'.repeat(this.pulses)}${'·'.repeat(3-this.pulses)}`,1234,114);
    }
    drawActive(ctx){if(!this.active)return;const points=this.active.points,wind=this.night.wind;ctx.strokeStyle=this.active.invalid?C.rust:C.thread;ctx.lineWidth=this.active.invalid?3.4:2.8;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y+Math.sin(this.elapsed*2+i*.7)*wind*(i/points.length)*.09);ctx.stroke();ctx.strokeStyle=this.active.invalid?'rgba(154,79,61,.7)':'rgba(231,221,200,.32)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(this.active.end.x,this.active.end.y,24+Math.sin(this.elapsed*5)*4,0,TAU);ctx.stroke();}
    render(){
      const ctx=this.ctx;ctx.save();if(this.shake&&!this.reduced)ctx.translate((Math.random()-.5)*8*this.shake,(Math.random()-.5)*8*this.shake);this.paper(ctx);if(this.state==='title'){this.drawTitle(ctx);ctx.restore();return;}this.drawHud(ctx);for(const tear of this.tears)tear.draw(ctx,this.elapsed);this.drawActive(ctx);for(const moth of this.moths)moth.draw(ctx,this.profile.cutContactSeconds);for(const mark of this.marks)if(mark.life>0)mark.draw(ctx);
      if(this.pulseWave>0){ctx.globalAlpha=this.pulseWave*.7;ctx.strokeStyle=C.paper;ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.pointer.x,this.pointer.y,(1-this.pulseWave)*190,0,TAU);ctx.stroke();ctx.globalAlpha=1;}if(this.messageLife>0){ctx.textAlign='center';ctx.fillStyle=this.message.includes('끊')||this.message.includes('벗어난')?C.rust:C.paper;ctx.font='italic 22px Georgia, Noto Serif KR, serif';ctx.fillText(this.message,640,145);}
      if(['paused','gameover','victory'].includes(this.state)){ctx.fillStyle='rgba(12,13,19,.76)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle=C.thread;ctx.font='15px Georgia, Noto Serif KR, serif';ctx.fillText(this.state==='victory'?'새벽 · DAWN':this.state==='gameover'?'풀린 밤 · UNRAVELLED':'고요 · PAUSED',640,260);ctx.fillStyle=C.paper;ctx.font='40px Georgia, Noto Serif KR, serif';ctx.fillText(this.state==='victory'?'열두 밤을 모두 꿰맸습니다':this.state==='gameover'?'밤이 먼저 풀려버렸습니다':'바늘은 잠시 쉽니다',640,316);ctx.font='16px Georgia, serif';ctx.fillStyle='rgba(231,221,200,.7)';ctx.fillText(this.state==='paused'?'P / ESC TO RETURN':`SCORE ${this.score.toLocaleString()} · ${this.profile.labelEn} BEST ${this.highScore().toLocaleString()}`,640,354);}
      ctx.restore();
    }
  }

  const canvas=document.querySelector('#game'),game=new Game(canvas),mute=document.querySelector('#mute'),start=document.querySelector('#start'),panel=document.querySelector('#difficulty-panel'),description=document.querySelector('#difficulty-description'),choices=[...document.querySelectorAll('.difficulty-choice')];
  function updateChoice(id,focus=false){if(!game.setDifficulty(id))return;const profile=Rules.DIFFICULTY_PROFILES[id];for(const choice of choices)choice.setAttribute('aria-pressed',String(choice.dataset.difficulty===id));description.textContent=`${profile.descriptionKo} · ${profile.labelEn} ×${profile.scoreMultiplier.toFixed(2)}`;if(focus)choices.find(choice=>choice.dataset.difficulty===id).focus();}
  function setSelectionVisibility(visible,label='ENTER THE NIGHT'){panel.hidden=!visible;start.hidden=!visible;start.textContent=label;}
  for(const choice of choices){choice.addEventListener('click',()=>updateChoice(choice.dataset.difficulty));choice.addEventListener('keydown',event=>{if(event.code==='Enter'){event.preventDefault();updateChoice(choice.dataset.difficulty);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code))return;event.preventDefault();const direction=['ArrowRight','ArrowDown'].includes(event.code)?1:-1,index=choices.indexOf(choice),next=(index+direction+choices.length)%choices.length;updateChoice(choices[next].dataset.difficulty,true);});}
  start.addEventListener('click',()=>game.start());mute.addEventListener('click',()=>{game.audio.wake();const muted=game.audio.toggle();mute.textContent=muted?'SOUND · OFF':'SOUND · ON';mute.setAttribute('aria-pressed',String(muted));mute.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');canvas.focus();});

  function debugSnapshot(){
    const point=value=>Object.freeze({x:value.x,y:value.y}),tuning=game.effectiveTuning(),selection=game.selection;
    return Object.freeze({mode:game.state,difficultyId:game.selectedDifficultyId,difficultyLabel:game.profile.labelKo,night:game.nightIndex+1,totalNights:Rules.TOTAL_NIGHTS,runSeed:game.runSeed,currentPatternId:selection?selection.patternId:null,currentPatternName:selection?`${selection.patternNameKo} · ${selection.patternNameEn}`:null,phase:game.nightIndex+1,score:game.score,combo:game.combo,integrity:game.integrity,thread:Math.round(game.thread),pulses:game.pulses,muted:game.audio.muted,remainingTears:game.tears.filter(tear=>!tear.done).length,effectiveMothTuning:Object.freeze({...tuning}),mothCount:game.moths.length,representativeSpeeds:Object.freeze(game.moths.slice(0,3).map(moth=>Math.round(Math.hypot(moth.vx,moth.vy)*100)/100)),activeSeamInvalid:game.active?game.active.invalid:null,tears:Object.freeze(game.tears.filter(tear=>!tear.done).map(tear=>Object.freeze({a:point(tear.a),b:point(tear.b),path:Object.freeze(tear.path.map(point))})))});
  }
  window.__STITCHKEEPER__=Object.freeze({snapshot:debugSnapshot,actions:Object.freeze({finishForTest:()=>{if(game.state==='play'||game.state==='paused')game.finish(false);return debugSnapshot();},completeNightForTest:()=>{if(game.state!=='play')return debugSnapshot();for(const tear of game.tears)tear.done=true;game.advanceNight();return debugSnapshot();}})});
})();
