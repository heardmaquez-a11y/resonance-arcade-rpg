(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');\nconst guardianAtlas=new Image();guardianAtlas.src='./assets/guardian_atlas.png';
const W=960,H=540, FLOOR=460, SAVE='resonance-save-v2';
const worlds=[
 {name:'THE HOLLOW',sub:'The silence between stars',boss:'THE HOLLOW KING',kind:'king',colors:['#100d2a','#30204d','#5b3678'],ground:'#39304e',glow:'#b77bff',scale:[55,65.4,73.4,82.4,98,110],bpm:88,weak:'chord'},
 {name:'FORGOTTEN FOREST',sub:'Nature remembers every note',boss:'THE ROOT MOTHER',kind:'tree',colors:['#071c21','#14513b','#39774b'],ground:'#314f39',glow:'#9dff65',scale:[65.4,73.4,82.4,98,110,130.8],bpm:104,weak:'wave'},
 {name:'CITY OF DISCORD',sub:'Machines lost their rhythm',boss:'THE NOISE ENGINE',kind:'mech',colors:['#09182d','#20396d','#345f83'],ground:'#34445d',glow:'#55dfff',scale:[73.4,82.4,98,110,130.8,146.8],bpm:126,weak:'wave'},
 {name:'REALM OF SHADOWS',sub:'Face the shape of fear',boss:'THE ECLIPSE',kind:'wraith',colors:['#100a20','#30204f','#563174'],ground:'#41304d',glow:'#d58cff',scale:[49,55,65.4,73.4,82.4,98],bpm:72,weak:'dash'},
 {name:'CELESTIAL KINGDOM',sub:'The final chord awaits',boss:'THE DISCORDANT ONE',kind:'angel',colors:['#25143c','#75487d','#d28a58'],ground:'#6a5170',glow:'#ffe08a',scale:[82.4,98,110,130.8,146.8,164.8],bpm:116,weak:'chord'}
];
const input={left:false,right:false};
let mode='menu',world=0,score=0,shards=0,hp=5,maxHp=5,amp=0,frame=0,last=0,camera=0,toastTime=0,toastText='',audio=null,upgrades={power:0,range:0,heart:0,speed:0},save={world:0,score:0,shards:0,upgrades:{},maxHp:5};
const hero={x:100,y:390,vx:0,vy:0,w:34,h:58,face:1,ground:false,inv:0,dash:0,anim:0,attack:0};
let level={length:2300,platforms:[],crystals:[],switches:[],gateOpen:false,boss:null,shots:[],waves:[],sparks:[],checkpoint:100};
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function say(t){toastText=t;toastTime=110;$('toast').textContent=t;$('toast').classList.remove('hide')}
function saveGame(){try{save={world,score,shards,upgrades:{...upgrades},maxHp};localStorage.setItem(SAVE,JSON.stringify(save))}catch(e){}}
function loadGame(){try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(s&&s.world>=0&&s.world<5){save=s;world=s.world;score=s.score||0;shards=s.shards||0;upgrades={...upgrades,...s.upgrades};maxHp=s.maxHp||5;hp=maxHp}}catch(e){}}
function audioStart(){if(audio){audio.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=new AC(),master=c.createGain();master.gain.value=.14;master.connect(c.destination);audio={ctx:c,master,next:c.currentTime+.05,step:0};musicLoop()}
function tone(freq,dur=.15,type='triangle',vol=.18,when){if(!audio)return;const c=audio.ctx,o=c.createOscillator(),g=c.createGain(),t=when??c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audio.master);o.start(t);o.stop(t+dur+.025)}
function musicLoop(){if(!audio)return;const c=audio.ctx,theme=worlds[world]||worlds[4],dur=60/theme.bpm/2;while(audio.next<c.currentTime+.2){const s=audio.step%16,root=theme.scale[[0,2,3,1,4,2,5,3][s%8]],t=audio.next;tone(root,.22,'triangle',.025,t);if(s%4===0){tone(root/2,.24,'sine',.065,t);tone(root*2,.12,'sine',.018,t+.01)}if(s%8===6)tone(root*1.5,.1,'square',.012,t);audio.next+=dur;audio.step++}setTimeout(musicLoop,70)}
function sfx(type){if(!audio)return;const seq={wave:[110,165,220],chord:[220,277,330,440],hit:[130,195],hurt:[85,62],pickup:[440,554,659],win:[330,440,554,660,880],dash:[180,360]}[type]||[220];seq.forEach((n,i)=>tone(n,.13,type==='hurt'?'sawtooth':'triangle',.13,audio.ctx.currentTime+i*.035))}
function makeWorld(){const t=worlds[world];level={length:2350,platforms:[],crystals:[],switches:[],gateOpen:false,boss:null,shots:[],waves:[],sparks:[],checkpoint:100};hero.x=100;hero.y=FLOOR-hero.h;hero.vx=hero.vy=0;hero.ground=true;camera=0;amp=0;
 for(let i=0;i<10;i++){const x=300+i*190;level.platforms.push({x,y:rand(300,405),w:rand(90,150),h:16})}
 for(let i=0;i<3;i++)level.crystals.push({x:510+i*520,y:[335,270,350][i],active:false,phase:i});
 for(let i=0;i<3;i++)level.switches.push({x:760+i*440,y:420,active:false});
 say(t.name+' — '+t.sub);$('bossbar').classList.add('hide');hud()}
function begin(){audioStart();$('menu').classList.add('hide');$('pauseMenu').classList.add('hide');$('upgradeMenu').classList.add('hide');$('endMenu').classList.add('hide');$('gameover').classList.add('hide');mode='play';makeWorld()}
function jump(){if(mode==='play'&&hero.ground){hero.vy=-13;hero.ground=false;tone(440,.08)}}
function attack(type){if(mode!=='play')return;if(type==='dash'){if(hero.dash<=0){hero.dash=14;hero.dashHit=false;hero.vx=hero.face*(12+upgrades.speed);sfx('dash')}return}
 if(type==='wave'){if(hero.attack>0)return;hero.attack=22;level.waves.push({x:hero.x+hero.face*30,y:hero.y+24,vx:hero.face*(10+upgrades.speed*.4),life:34,r:20+upgrades.range*6,kind:'wave'});amp=clamp(amp+12,0,100);sfx('wave')}
 if(type==='chord'&&amp>=50){amp-=50;level.waves.push({x:hero.x+hero.face*36,y:hero.y+24,vx:hero.face*13,life:42,r:55+upgrades.range*8,kind:'chord'});sfx('chord');say('HARMONY CHORD!')}
}
function activateCrystal(c){if(c.active)return;c.active=true;shards++;score+=250;amp=clamp(amp+18,0,100);sfx('pickup');say('RESONANCE NODE '+(level.crystals.filter(x=>x.active).length)+'/3');for(let i=0;i<24;i++)level.sparks.push({x:c.x,y:c.y,vx:rand(-3,3),vy:rand(-4,2),life:40,color:worlds[world].glow})}
function spawnBoss(){if(level.boss||!level.gateOpen)return;const t=worlds[world];level.boss={x:level.length-260,y:275,w:155,h:185,hp:220+world*55,max:220+world*55,phase:1,timer:100,flash:0,dead:false,defeat:0,pattern:0,warning:0};$('bossbar').classList.remove('hide');say(t.boss+' AWAKENS')}
function hurt(){if(hero.inv>0)return;hp--;hero.inv=90;hero.vx=-hero.face*7;hero.vy=-6;sfx('hurt');if(hp<=0){mode='gameover';$('gameover').classList.remove('hide');return}}
function update(){frame++;const t=worlds[world];if(hero.inv>0)hero.inv--;if(hero.attack>0)hero.attack--;if(hero.dash>0)hero.dash--;else hero.dashHit=false;hero.anim+=Math.abs(hero.vx)*.08+.04;
 if(input.left){hero.vx-=.72;hero.face=-1}if(input.right){hero.vx+=.72;hero.face=1}hero.vx*=hero.ground?.78:.94;hero.vx=clamp(hero.vx,-5-upgrades.speed*.5,5+upgrades.speed*.5);hero.vy=Math.min(hero.vy+.58,13);
 const oldY=hero.y;hero.x+=hero.vx;hero.y+=hero.vy;hero.ground=false;if(hero.y+hero.h>=FLOOR){hero.y=FLOOR-hero.h;hero.vy=0;hero.ground=true}
 for(const p of level.platforms)if(hero.x+hero.w>p.x&&hero.x<p.x+p.w&&oldY+hero.h<=p.y+8&&hero.y+hero.h>=p.y&&hero.vy>=0){hero.y=p.y-hero.h;hero.vy=0;hero.ground=true}
 hero.x=clamp(hero.x,0,level.length);
 for(const c of level.crystals)if(!c.active&&Math.abs(hero.x+16-c.x)<48&&Math.abs(hero.y+25-c.y)<52&&level.waves.some(w=>Math.abs(w.x-c.x)<60&&Math.abs(w.y-c.y)<70))activateCrystal(c);
 for(const s of level.switches)if(!s.active&&level.waves.some(w=>Math.abs(w.x-s.x)<55&&Math.abs(w.y-s.y)<85)){s.active=true;score+=100;level.gateOpen=level.switches.every(x=>x.active)&&level.crystals.every(x=>x.active);say(level.gateOpen?'THE SEAL IS OPEN — FACE THE GUARDIAN':'ANCIENT SWITCH ACTIVATED')}
 if(level.crystals.every(c=>c.active)&&level.switches.every(s=>s.active))level.gateOpen=true;
 const b=level.boss;for(const w of level.waves){w.x+=w.vx;w.life--;if(!w.hit){for(const c of level.crystals)if(!c.active&&Math.abs(w.x-c.x)<45&&Math.abs(w.y-c.y)<60){activateCrystal(c);w.hit=true}for(const s of level.switches)if(!s.active&&Math.abs(w.x-s.x)<45&&Math.abs(w.y-s.y)<70){s.active=true;score+=100;w.hit=true;sfx('pickup');if(level.switches.every(x=>x.active)&&level.crystals.every(x=>x.active)){level.gateOpen=true;say('THE SEAL IS OPEN')}}}
 const b=level.boss;if(b&&!b.dead&&Math.abs(w.x-(b.x+65))<w.r+85&&Math.abs(w.y-(b.y+85))<w.r+100){let dmg=w.kind==='chord'?54+upgrades.power*12:22+upgrades.power*7;const weakness=t.weak==='both'||t.weak===w.kind; if(weakness)dmg*=1.55;b.hp-=dmg;b.flash=10;w.life=0;score+=Math.round(dmg);sfx('hit');if(b.hp<=b.max*.5&&b.phase===1){b.phase=2;b.timer=45;say('GUARDIAN — PHASE TWO!')}}}
 level.waves=level.waves.filter(w=>w.life>0);
 if(level.gateOpen&&hero.x>level.length-560&&!level.boss)spawnBoss();
 if(b&&!b.dead){b.timer--;b.y=275+Math.sin(frame*.035+world)*25;if(b.flash)b.flash--;if(b.timer<=0){b.pattern++;b.timer=(b.phase===2?54:84)-world*3;b.warning=22;const count=b.phase===2?4:2;for(let i=0;i<count;i++)level.shots.push({x:b.x+20,y:b.y+65+i*24,vx:-5.3-world*.35,vy:(i-(count-1)/2)*.65,life:115,r:17+world,kind:'enemy'})}if(b.warning>0)b.warning--;if(Math.abs(hero.x-b.x)<190&&Math.abs(hero.y-b.y)<150)hurt()}
 for(const p of level.shots){p.x+=p.vx;p.y+=p.vy;p.life--;if(Math.abs(hero.x+16-p.x)<p.r+18&&Math.abs(hero.y+25-p.y)<p.r+28){hurt();p.life=0}}
 level.shots=level.shots.filter(p=>p.life>0);
 if(b&&b.hp<=0&&!b.dead){b.dead=true;b.defeat=0;sfx('win');say('GUARDIAN DEFEATED — HARMONY RESTORED')}
 if(b&&b.dead){b.defeat++;if(b.defeat>95){score+=1000;shards+=5;world++;if(world>=5){world=4;mode='victory';try{localStorage.removeItem(SAVE)}catch(e){}$('victory').classList.remove('hide');return}saveGame();mode='upgrade';showUpgrades();return}}
 for(const s of level.sparks){s.x+=s.vx;s.y+=s.vy;s.vy+=.12;s.life--}level.sparks=level.sparks.filter(s=>s.life>0);
 camera=clamp(hero.x-340,0,level.length-W);if(toastTime>0){toastTime--;if(!toastTime)$('toast').classList.add('hide')}
 hud()
}
function pixel(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function drawBackground(){const t=worlds[world]||worlds[4],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,t.colors[0]);g.addColorStop(.6,t.colors[1]);g.addColorStop(1,t.colors[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<10;i++){let x=((i*167-camera*.16)%1120+1120)%1120-80,y=75+(i%4)*45;pixel(x,y,3,3,'#fff4d3');pixel(x-2,y-2,7,7,t.glow+'44')}
 for(let i=0;i<9;i++){let x=((i*205-camera*.32)%1200+1200)%1200-100;pixel(x,235-(i%3)*28,38,225,'#17172f');pixel(x-8,230-(i%3)*28,54,10,t.glow+'66');pixel(x+12,275-(i%3)*28,9,40,'#33294d')}
 pixel(0,FLOOR,W,80,t.ground);for(let x=0;x<W;x+=32){pixel(x,FLOOR,29,5,t.glow);pixel(x+5,480,14,4,'#151426')}
}
function drawHero(){const x=hero.x-camera,y=hero.y,bob=hero.ground?Math.sin(hero.anim)*2:0;ctx.save();if(hero.inv&&frame%8<4)ctx.globalAlpha=.45;
 // cloak and hood
 pixel(x+6,y+18+bob,25,30,'#111528');pixel(x+3,y+3+bob,30,23,'#151a31');pixel(x+4,y+1+bob,28,9,'#29304e');pixel(x+11,y+10+bob,4,4,'#e7b991');pixel(x+22,y+10+bob,4,4,'#e7b991');pixel(x+14,y+17+bob,9,3,'#5b3436');
 // boots and gloves
 pixel(x+4,y+44+bob,11,13,'#191a2c');pixel(x+22,y+44+bob,11,13,'#191a2c');pixel(x+1,y+55+bob,15,4,'#d6e0ed');pixel(x+19,y+55+bob,16,4,'#d6e0ed');pixel(x+27,y+28+bob,10,7,'#9b603b');
 // bass body, neck, strings
 pixel(x+15,y+26+bob,30,7,'#218d49');pixel(x+37,y+15+bob,6,26,'#b4d76e');pixel(x+44,y+11+bob,4,31,'#d6bd81');for(let i=0;i<4;i++)pixel(x+41+i,y+14+bob,1,24,'#f4e8b0');pixel(x+18,y+27+bob,8,4,'#edc45a');pixel(x+25,y+29+bob,4,2,'#111');
 ctx.restore()}
function drawBoss(b){const t=worlds[world]||worlds[4],x=b.x-camera,y=b.y,c=t.glow;const aura=ctx.createRadialGradient(x+75,y+80,8,x+75,y+80,190);aura.addColorStop(0,c+'88');aura.addColorStop(1,'transparent');ctx.fillStyle=aura;ctx.fillRect(x-70,y-70,300,300);const pose=b.dead?3:(b.flash>0?2:(b.warning>0?1:0));if(guardianAtlas.complete&&guardianAtlas.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(guardianAtlas,pose*48,world*25,48,25,x-18,y+30,192,100)}else{pixel(x+25,y+42,105,115,'#292044');pixel(x+13,y+22,130,47,'#292044');pixel(x+45,y+74,17,9,'#fff1a4');pixel(x+96,y+74,17,9,'#fff1a4')}if(b.warning>0&&!b.dead){ctx.strokeStyle='#ff647e';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x+78,y+85,110+Math.sin(frame*.5)*8,0,Math.PI*2);ctx.stroke()}}\nfunction draw(){drawBackground();for(const p of level.platforms){const x=p.x-camera;if(x>-160&&x<W+100){pixel(x,p.y,p.w,p.h,'#75617f');pixel(x,p.y,p.w,5,worlds[world]?.glow||'#ffe08a');for(let a=0;a<p.w;a+=22)pixel(x+a,p.y+8,15,5,'#29233e')}}
 for(const c of level.crystals){const x=c.x-camera;if(x>-30&&x<W+30){ctx.save();ctx.translate(x,c.y);ctx.rotate(Math.PI/4);pixel(-10,-10,20,20,c.active?'#fff3a0':worlds[world].glow);pixel(-5,-5,10,10,c.active?'#fff':'#543b80');ctx.restore();if(c.active){ctx.strokeStyle=worlds[world].glow;ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(x,c.y,25+Math.sin(frame*.08)*4,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}}}
 for(const s of level.switches){const x=s.x-camera;pixel(x-12,420,24,35,s.active?worlds[world].glow:'#51486b');pixel(x-6,426,12,12,s.active?'#fff':'#17152b')}
 if(!level.gateOpen){const gx=level.length-460-camera;pixel(gx,250,12,210,'#bd5a87');pixel(gx-8,250,28,8,'#ffd46a');for(let y=270;y<450;y+=25)pixel(gx-8,y,28,4,'#ff8baf')}
 for(const s of level.sparks)pixel(s.x-camera,s.y,4,4,s.color);drawHero();
 for(const w of level.waves){const x=w.x-camera;ctx.strokeStyle=w.kind==='chord'?'#ffdf6b':'#5df0ff';ctx.lineWidth=w.kind==='chord'?8:4;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x,w.y,w.r+i*9,-1.25,1.25);ctx.stroke()}}
 for(const p of level.shots){ctx.fillStyle='#ff658c';ctx.beginPath();ctx.arc(p.x-camera,p.y,p.r,0,Math.PI*2);ctx.fill()}
 if(level.boss){const b=level.boss;if(!b.dead)drawBoss(b);else{ctx.globalAlpha=Math.max(0,1-b.defeat/95);pixel(b.x-camera,b.y,160,160,worlds[world]?.glow||'#ffe08a');ctx.globalAlpha=1}}
 // puzzle / portal indicator
 const done=level.crystals.filter(c=>c.active).length;$('puzzle').textContent='RESONANCE NODES '+done+'/3 · SWITCHES '+level.switches.filter(s=>s.active).length+'/3';
}
function hud(){$('hp').textContent=hp;$('shards').textContent=shards;$('hpbar').style.width=(hp/maxHp*100)+'%';$('ampbar').style.width=amp+'%';$('worldLabel').textContent='WORLD '+Math.min(world+1,5)+' · '+(worlds[world]?.name||'HARMONY');if(level.boss&&!level.boss.dead){$('bossbar').classList.remove('hide');$('bossname').textContent=worlds[world].boss;$('bosshp').style.width=(level.boss.hp/level.boss.max*100)+'%'}else $('bossbar').classList.add('hide')}
function showUpgrades(){const opts=[['power','SONIC POWER','Stronger bass attacks'],['range','WAVE RANGE','Waves reach farther'],['heart','VITALITY','Gain one extra heart'],['speed','RHYTHM SPEED','Move and dash faster']];const box=$('upgradeChoices');box.innerHTML='';let chosen=false;for(const [key,title,desc] of opts){const b=document.createElement('button');b.className='btn';b.textContent=title+' — '+desc;b.onclick=()=>{if(chosen)return;chosen=true;upgrades[key]++;if(key==='heart'){maxHp++;hp=maxHp}b.textContent='✓ '+title;saveGame()};box.appendChild(b)}$('upgradeMenu').classList.remove('hide')}
function endGame(){mode='menu';world=0;score=0;shards=0;hp=maxHp=5;amp=0;upgrades={power:0,range:0,heart:0,speed:0};try{localStorage.removeItem(SAVE)}catch(e){}$('victory').classList.add('hide');$('gameover').classList.add('hide');$('menu').classList.remove('hide');makeWorld()}
function loop(t){const dt=Math.min(.04,(t-last)/1000||.016);last=t;if(mode==='play'){update();draw()}else if(mode!=='menu'){draw()}else{draw()}if(mode==='play'||mode==='upgrade'||mode==='pause'||mode==='menu')hud();requestAnimationFrame(loop)}
// UI and input
$('start').onclick=()=>{loadGame();begin()};$('newgame').onclick=()=>{world=0;score=shards=0;hp=maxHp=5;amp=0;upgrades={power:0,range:0,heart:0,speed:0};try{localStorage.removeItem(SAVE)}catch(e){}begin()};
$('resume').onclick=()=>{$('pauseMenu').classList.add('hide');mode='play'};$('pause').onclick=()=>{if(mode==='play'){mode='pause';$('pauseMenu').classList.remove('hide')}else if(mode==='pause'){$('pauseMenu').classList.add('hide');mode='play'}};
$('restart').onclick=()=>{mode='play';$('pauseMenu').classList.add('hide');makeWorld()};$('continue').onclick=()=>{$('upgradeMenu').classList.add('hide');mode='play';makeWorld()};$('again').onclick=endGame;$('retry').onclick=()=>{hp=maxHp;mode='play';$('gameover').classList.add('hide');makeWorld()};$('reset').onclick=endGame;
const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',' ':'jump',w:'jump',j:'wave',k:'chord',Shift:'dash'};addEventListener('keydown',e=>{const a=map[e.key];if(a){e.preventDefault();if(a==='left'||a==='right')input[a]=true;else if(!e.repeat) a==='jump'?jump():attack(a)}if(e.key==='Escape')$('pause').click()});addEventListener('keyup',e=>{const a=map[e.key];if(a==='left'||a==='right')input[a]=false});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key,down=e=>{e.preventDefault();b.classList.add('down');if(k==='left'||k==='right')input[k]=true;else k==='jump'?jump():attack(k==='burst'?'chord':k)},up=e=>{e.preventDefault();b.classList.remove('down');if(k==='left'||k==='right')input[k]=false};b.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up))});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')$('pause').click()});
makeWorld();requestAnimationFrame(loop);
})();