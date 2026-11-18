// Dependency-free engine regression checks. Run with: node tests/smoke-test.js
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let frames = [];
let drawCalls = 0;
const ctx2d = {
  fillRect(){drawCalls++}, createLinearGradient(){return{addColorStop(){}}}, createRadialGradient(){return{addColorStop(){}}},
  save(){}, restore(){}, beginPath(){}, arc(){}, ellipse(){}, stroke(){}, translate(){}, rotate(){}, scale(){},
  drawImage(){drawCalls++}, fill(){}, moveTo(){}, lineTo(){}
};
const elements = new Map();
function element(id){
  if(elements.has(id)) return elements.get(id);
  const el = {id, textContent:'', innerHTML:'', style:{}, dataset:{}, listeners:{}, onclick:null,
    classList:{add(){},remove(){},toggle(){}}, appendChild(){},
    addEventListener(type,fn){this.listeners[type]=fn},
    getContext(){return ctx2d}
  };
  elements.set(id,el); return el;
}
const touchKeys=['left','right','jump','wave','burst','note0','note1','note2','note3'];
const document = {
  getElementById:element,
  querySelectorAll(){return touchKeys.map(key=>{const el=element('touch-'+key);el.dataset.key=key;return el})},
  addEventListener(){}, createElement(){return element('created-'+elements.size)}
};
const window = {};
const localStorage = {getItem(){return null},setItem(){},removeItem(){}};
class ImageStub { constructor(){this.complete=false;this.naturalWidth=0;this.src=''} }
const source = fs.readFileSync(require('node:path').join(__dirname,'..','game.js'),'utf8')
  .replace(/\}\)\(\);\s*$/, "globalThis.__test={hero,getLevel:()=>level,draw,update,attack,pressNote,setWorld:v=>world=v,setStage:v=>stage=v,makeWorld,getStage:()=>stage};})();");
const sandbox = {
  document, window, localStorage, Image:ImageStub, console,
  requestAnimationFrame(fn){frames.push(fn)},
  addEventListener(){},
  Math, Date, JSON, Number, String, Array, Object, Set, Map
};
sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox,{timeout:3000});
assert.equal(frames.length,1,'render loop should schedule its first frame');
element('start').onclick();
const game=sandbox.__test;
assert.ok(game,'test hooks should be exposed');
for(let i=0;i<12;i++){const fn=frames.shift();fn(i*16);assert.ok(frames.length,'loop should keep scheduling frames')}
game.hero.vx=3;game.hero.anim=20;game.draw();
game.attack('wave');game.draw();game.attack('chord');game.attack('dash');
for(let i=0;i<80;i++){game.update();game.draw()}
assert.ok(drawCalls>100,'hero and combat frames should draw to canvas');
// Touch controls are bound and pointer events do not throw.
const left=element('touch-left');
assert.equal(typeof left.listeners.pointerdown,'function');
left.listeners.pointerdown({preventDefault(){}});
left.listeners.pointerup({preventDefault(){}});
// All five guardian spawn/attack sequences.
for(let world=0;world<5;world++){
  game.setWorld(world);game.setStage(2);game.makeWorld();
  const level=game.getLevel();game.hero.inv=999;game.hero.vx=0;game.hero.x=level.length-500;level.gateOpen=true;
  game.update();
  assert.ok(game.getLevel().boss,'guardian '+world+' should spawn');
  game.getLevel().boss.timer=1;game.update();
  assert.ok(game.getLevel().shots.length>0,'guardian '+world+' should attack');
}
// The four-note puzzle sequence opens a seal.
game.setWorld(0);game.setStage(0);game.makeWorld();
let level=game.getLevel();const seal=level.switches[0];game.hero.x=seal.x-17;
for(const note of seal.seq)game.pressNote(note);
assert.equal(seal.active,true,'correct note sequence should harmonize a seal');
// Bass chord purges a low-health demon.
level=game.getLevel();const demon=level.demons[0];demon.hp=1;
level.waves.push({x:demon.x,y:demon.y-12,vx:0,life:3,r:90,kind:'chord',hit:false});
game.update();assert.equal(demon.dead,true,'bass chord should purge a demon');
// Final guardian reaches its third phase.
game.setWorld(4);game.setStage(2);game.makeWorld();level=game.getLevel();
level.gateOpen=true;game.hero.inv=999;game.hero.x=level.length-500;game.update();
const finalBoss=game.getLevel().boss;assert.ok(finalBoss,'final guardian should spawn');
finalBoss.hp=finalBoss.max*.45;
game.getLevel().waves.push({x:finalBoss.x+65,y:finalBoss.y+85,vx:0,life:3,r:90,kind:'chord',hit:false});
game.update();assert.equal(finalBoss.phase,2,'final guardian should enter phase two');
finalBoss.hp=finalBoss.max*.2;
game.getLevel().waves.push({x:finalBoss.x+65,y:finalBoss.y+85,vx:0,life:3,r:90,kind:'chord',hit:false});
game.update();assert.equal(finalBoss.phase,3,'final guardian should enter true form');
console.log('RESONANCE smoke tests passed: render loop, pixel animation draw, touch binding, 5 guardian spawns/attacks, note puzzle, demon purge, final boss phase 3.');
