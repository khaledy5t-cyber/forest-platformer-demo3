const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// fullscreen adapt
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

const ASSETS = {
  player: 'assets/player_sheet.png',
  tiles: 'assets/tiles.png',
  bg: 'assets/bg.png',
  flag: 'assets/flag.png',
  shard: 'assets/shard.png',
  jump: 'assets/jump.wav',
  pickup: 'assets/pickup.wav',
  victory: 'assets/victory.wav',
  ambience: 'assets/ambience.wav'
};

let images = {}, audioCtx=null, audioBuf={};
async function loadAssets(){
  const keys=['player','tiles','bg','flag','shard'];
  for(const k of keys){ const img=new Image(); img.src=ASSETS[k]; await new Promise(r=>{ img.onload=r; img.onerror=r; }); images[k]=img; }
  try{ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); const names=['jump','pickup','victory','ambience']; for(const n of names){ const r=await fetch(ASSETS[n]); const ab=await r.arrayBuffer(); audioBuf[n]=await audioCtx.decodeAudioData(ab); } }catch(e){ console.warn('audio failed',e); }
}
function play(name,vol=0.12){ if(!audioCtx||!audioBuf[name]) return; const s=audioCtx.createBufferSource(); s.buffer=audioBuf[name]; const g=audioCtx.createGain(); g.gain.value=vol; s.connect(g); g.connect(audioCtx.destination); s.start(); return s; }

// level
const TILE = 64;
const LEVEL_W = 60, LEVEL_H = 9;
let level = [];
function genLevel(){
  level = Array.from({length:LEVEL_H}, ()=>Array(LEVEL_W).fill(0));
  for(let x=0;x<LEVEL_W;x++){ level[LEVEL_H-2][x] = 1; } // ground
  for(let i=6;i<LEVEL_W-6;i+=5){
    const h = LEVEL_H-3 - (Math.floor(Math.random()*2));
    level[h][i] = 1; level[h][i+1] = 1;
    if(Math.random()>0.6) level[h-1][i+1] = 1;
  }
  return {flagX:(LEVEL_W-4)*TILE + TILE/2, flagY:(LEVEL_H-3)*TILE};
}
const meta = genLevel();

// player
let player = { x:160, y:200, vx:0, vy:0, w:48, h:96, grounded:false, jumps:0, hp:3, shards:0, anim:0, facing:1 };
let camX = 0;
let shardPos = { x: Math.floor(LEVEL_W/2)*TILE, y:(LEVEL_H-4)*TILE - 24, taken:false };
let keys = {};

// input
window.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()] = true; if((e.key===' '||e.key.toLowerCase()==='w') && (player.grounded || player.jumps<2)){ // jump/double
    if(player.grounded){ player.jumps=1; } else { player.jumps++; }
    player.vy = -12; player.grounded=false; play('jump'); }
});
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });

// physics & update
function update(dt){
  let ax = 0;
  if(keys['a']||keys['arrowleft']) ax = -1;
  if(keys['d']||keys['arrowright']) ax = 1;
  player.vx += ax*1.2;
  player.vx *= 0.85;
  player.vy += 0.6;
  player.vx = Math.max(-12, Math.min(12, player.vx));
  player.vy = Math.max(-24, Math.min(24, player.vy));
  player.x += player.vx; player.y += player.vy;
  // ground collision
  const tileAt = (px,py)=>{ const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE); if(tx<0||tx>=LEVEL_W||ty<0||ty>=LEVEL_H) return 0; return level[ty][tx]; };
  player.grounded = false;
  const below = tileAt(player.x, player.y + player.h/2 + 4);
  if(below===1 && player.vy>=0){
    const ty = Math.floor((player.y + player.h/2 + 4)/TILE);
    player.y = ty*TILE - player.h/2 - 0.1; player.vy = 0; player.grounded = true; player.jumps = 0;
  }
  if(player.x < 40) player.x = 40;
  camX = Math.max(0, player.x - canvas.width/3);
  // shard pickup
  if(!shardPos.taken && Math.hypot(player.x - shardPos.x, player.y - shardPos.y) < 56){
    shardPos.taken = true; player.shards += 1; play('pickup'); document.getElementById('shards').textContent = player.shards;
  }
  // flag reach
  if(Math.hypot(player.x - meta.flagX, player.y - meta.flagY) < 72){
    play('victory'); setTimeout(()=>{ alert('Demo complete — you reached the flag!'); }, 50); player.vx = 0; player.vy = 0;
  }
  // animation progress
  if(Math.abs(player.vx) > 0.5) player.anim += 0.18; else player.anim *= 0.85;
  player.facing = (player.vx < -0.5) ? -1 : (player.vx > 0.5) ? 1 : player.facing;
}

// draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(images['bg']) ctx.drawImage(images['bg'], -camX*0.2, 0, images['bg'].width, images['bg'].height * (canvas.height/images['bg'].height));
  // tiles
  for(let y=0;y<LEVEL_H;y++){
    for(let x=0;x<LEVEL_W;x++){
      if(level[y][x]===1){
        if(images['tiles']) ctx.drawImage(images['tiles'], 0,0,96,96, x*TILE - camX, y*TILE, TILE, TILE);
        else { ctx.fillStyle='#6b4a2b'; ctx.fillRect(x*TILE - camX, y*TILE, TILE, TILE); }
      }
    }
  }
  // shard
  if(!shardPos.taken && images['shard']) ctx.drawImage(images['shard'], shardPos.x - camX -24, shardPos.y -24, 48,48);
  // flag
  if(images['flag']) ctx.drawImage(images['flag'], meta.flagX - camX -32, meta.flagY - 128, 64,128);
  // player animation from spritesheet (3 frames)
  if(images['player']){
    const fw = images['player'].width/3, fh = images['player'].height;
    let frame = Math.floor(player.anim) % 3;
    if(frame < 0) frame = 0;
    ctx.save();
    ctx.translate(player.x - camX, player.y - player.h/2);
    if(player.facing === -1) { ctx.scale(-1,1); ctx.translate(-player.w,0); }
    ctx.drawImage(images['player'], frame*fw, 0, fw, fh, -player.w/2, 0, player.w, player.h);
    ctx.restore();
  } else {
    ctx.fillStyle='green'; ctx.fillRect(player.x - camX - player.w/2, player.y - player.h/2, player.w, player.h);
  }
  // UI update
  document.getElementById('hp').textContent = player.hp;
  document.getElementById('shards').textContent = player.shards;
}

// main loop
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now; update(dt); draw(); requestAnimationFrame(loop);
}

// start
async function start(){
  const keys = ['player','tiles','bg','flag','shard'];
  for(const k of keys){ const img = new Image(); img.src = ASSETS[k]; await new Promise(r=>{ img.onload=r; img.onerror=r; }); images[k]=img; }
  try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const names=['jump','pickup','victory','ambience']; for(const n of names){ const r=await fetch(ASSETS[n]); const ab = await r.arrayBuffer(); audioBuf[n] = await audioCtx.decodeAudioData(ab); } play('ambience',0.06); }catch(e){ console.warn('audio fail',e); }
  last = performance.now(); requestAnimationFrame(loop);
}

start();

// restart button
document.getElementById('restart').addEventListener('click', ()=>{ location.reload(); });

// request fullscreen on first user gesture for game-like feel
window.addEventListener('click', function once(){ if(document.fullscreenEnabled){ document.documentElement.requestFullscreen().catch(()=>{}); } window.removeEventListener('click', once); });
