'use strict';
// ================================================================
//  SUPER MARIO BROS
// ================================================================

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const CW = 800, CH = 450;

// DOM
const scoreEl  = document.getElementById('score');
const coinsEl  = document.getElementById('coins');
const timerEl  = document.getElementById('timer');
const livesEl  = document.getElementById('lives');
const fscoreEl = document.getElementById('fscore');
const wrapEl   = document.getElementById('wrap');
const sTitle   = document.getElementById('sTitle');
const sOver    = document.getElementById('sOver');
const sWin     = document.getElementById('sWin');

// ── Audio ─────────────────────────────────────────────────────
let AC = null;
function initAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
}
function tone(f, tp, d, v, delay) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.type = tp || 'square'; o.frequency.value = f;
    const s = AC.currentTime + (delay || 0);
    g.gain.setValueAtTime(v || 0.2, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + d);
    o.start(s); o.stop(s + d + 0.05);
  } catch(e) {}
}
const SFX = {
  jump:   function(){ tone(523,'square',.05,.3); tone(659,'square',.1,.3,.05); tone(784,'square',.15,.2,.1); },
  coin:   function(){ tone(988,'square',.08,.3); tone(1319,'square',.18,.3,.08); },
  stomp:  function(){ tone(220,'square',.05,.3); tone(110,'square',.12,.3,.05); },
  die:    function(){ [440,330,220,110].forEach(function(f,i){ tone(f,'square',.1,.3,i*.12); }); },
  brk:    function(){ [300,200,150].forEach(function(f,i){ tone(f,'sawtooth',.08,.2,i*.04); }); },
  power:  function(){ [523,659,784,1047].forEach(function(f,i){ tone(f,'square',.08,.25,i*.07); }); },
  flag:   function(){ [784,880,988,1047,1175].forEach(function(f,i){ tone(f,'square',.12,.25,i*.09); }); },
};

// ── Constants ─────────────────────────────────────────────────
const TILE  = 32;
const GY    = 12;       // ground row index (0=top). Ground top at y = GY*TILE = 384
const WW    = 6400;     // world width px
const GRAV  = 0.65;
const MFALL = 16;

// ── Palette ───────────────────────────────────────────────────
const SKY     = '#5c94fc';  // real mario sky blue
const GROUND1 = '#e07038';  // ground top
const GROUND2 = '#c84010';  // ground body
const GROUND3 = '#882800';  // ground dark lines
const BRICK1  = '#c84010';
const BRICK2  = '#e06030';
const BRICK3  = '#882800';
const QBLK1   = '#d09000';
const QBLK2   = '#f0b820';
const QBLK3   = '#806000';
const QDEAD   = '#907050';
const PIPE1   = '#00a800';
const PIPE2   = '#00cc00';
const PIPE3   = '#005000';
const COIN1   = '#ffd700';
const COIN2   = '#c08000';
const MSH_R   = '#e82820';
const MSH_W   = '#ffffff';
const MARIO_R = '#e82820';
const MARIO_S = '#f8a040';
const MARIO_B = '#1858c0';
const MARIO_W = '#783000';
const GOOM1   = '#b06820';
const GOOM2   = '#784010';
const POLE_C  = '#909090';
const FLAG_C  = '#00cc00';
const STAR_C  = '#ffd700';
const CLOUD1  = '#ffffff';
const MTN1    = '#70b800';
const MTN2    = '#ffffff';

// ── Pixel sprites ─────────────────────────────────────────────
// 12 wide × 16 tall. R=red S=skin B=blue W=brown .=clear
const SP = 2; // each pixel → SP×SP canvas pixels (sprite = 24×32)

const SPR = {
  stand: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RRWSSSWW..',
    '...SSSSSS...',
    '..RBBRBBRR..',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'SSRBBBBBRSS.',
    'SSRBBBBSSS..',
    '.SBBBBBBSS..',
    '...WWWWW....',
    '..WWWWWWW...',
    '.WWW...WWW..',
    'WWW.....WWW.',
  ],
  walk1: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RRWSSSWW..',
    '...SSSSSS...',
    '..RBBRBBRR..',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'SSRBBBBBRSS.',
    '.SSRBBBBSSSS',
    '..SBBBBBBSS.',
    '...WWWWWSS..',
    '..WWWWWWWW..',
    '.WW......WW.',
    '.W......WWW.',
  ],
  walk2: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RRWSSSWW..',
    '...SSSSSS...',
    '..RBBRBBRR..',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'SSRBBBBBRSS.',
    'SSRBBBBSSSS.',
    '.SBBBBBBBSS.',
    '..WWWWWWSS..',
    '.WWWWWWWWW..',
    'WW......WWW.',
    'W.......WW..',
  ],
  jump: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RRWSSSWW..',
    '...SSSSSS...',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'SSRBBBBBRSS.',
    '.SSRBBBBSSSS',
    'WW.WBBBBWWW.',
    '.WWWBBWWWWW.',
    '..WWWWWWWW..',
    '............',
    '............',
    '............',
  ],
  // Big Mario 12×24
  bstand: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RRRRRRRR..',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RWWWSSSWW.',
    '..RRWSSSSWW.',
    '...SSSSSSSS.',
    '..RBBRBBRR..',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'BBBBBBBBBBB.',
    'BBBBBBBBBBB.',
    'RBBBBBBBBBB.',
    'RRBBBBBBBB..',
    'RRRBBBBBRR..',
    'RRRRBBBBR...',
    'R...BBBW....',
    '...WWBBBWW..',
    '..WWWBBBWWW.',
    '.WW.....WWW.',
    'WW......WWWW',
    'W.......WWW.',
    '.WW....WWW..',
  ],
  bwalk: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RRRRRRRR..',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RWWWSSSWW.',
    '..RRWSSSSWW.',
    '...SSSSSSSS.',
    '..RBBRBBRR..',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'BBBBBBBBBBB.',
    'BBBBBBBBBBB.',
    'RBBBBBBBBBB.',
    'RRBBBBBBBB..',
    'RRRBBBBBRR..',
    'R..RBBBBWW..',
    '...WBBBWWW..',
    '..WWBBWWWW..',
    '.WWWBB.....W',
    'WWWWB......W',
    'WW.........W',
    '.W..........',
    '..WWWWWWWW..',
  ],
  bjump: [
    '....RRRR....',
    '...RRRRRRRR.',
    '..RRRRRRRR..',
    '..RWWWSSSS..',
    '..RWSWSSWS..',
    '..RWWWSSSWW.',
    '..RRWSSSSWW.',
    '...SSSSSSSS.',
    '..RBBBBBRR..',
    'RRRBBBBBBRRR',
    'BBBBBBBBBBB.',
    'BBBBBBBBBBB.',
    'RBBBBBBBBBB.',
    'RRRBBBBBRR..',
    'R..RBBBBWW..',
    '...WBBBWWW..',
    'WWWWBB......',
    'W...........',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
  ],
};

function drawSpr(grid, sx, sy, flipX, rainbow) {
  var rows = grid.length, cols = grid[0].length;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var ch = grid[r][flipX ? cols - 1 - c : c];
      if (ch === '.' || ch === ' ') continue;
      if (rainbow) {
        ctx.fillStyle = 'hsl(' + ((Date.now() / 4 + r * 24 + c * 18) % 360) + ',100%,55%)';
      } else {
        if      (ch === 'R') ctx.fillStyle = MARIO_R;
        else if (ch === 'S') ctx.fillStyle = MARIO_S;
        else if (ch === 'B') ctx.fillStyle = MARIO_B;
        else if (ch === 'W') ctx.fillStyle = MARIO_W;
        else                 ctx.fillStyle = '#f0f';
      }
      ctx.fillRect(sx + c * SP, sy + r * SP, SP, SP);
    }
  }
}

// ── State ─────────────────────────────────────────────────────
var STATE = 'title';  // title | play | dead | over | win
var score = 0, coins = 0, lives = 3, timeLeft = 400;
var camX = 0;
var timerTick = null;
var PLR = null, LVL = null;
var PARTS = [], PUPS = [];
var flagDone = false;

// ── Input ─────────────────────────────────────────────────────
var K = {};
window.addEventListener('keydown', function(e) {
  K[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) >= 0) {
    e.preventDefault();
  }
  if (e.code === 'Enter' || e.code === 'Space') tryStart();
});
window.addEventListener('keyup', function(e) { K[e.code] = false; });

function mBtn(id, code) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown',  function(){ K[code]=true;  initAC(); });
  el.addEventListener('pointerup',    function(){ K[code]=false; });
  el.addEventListener('pointerleave', function(){ K[code]=false; });
  el.addEventListener('touchstart',   function(){ K[code]=true;  initAC(); }, {passive:true});
  el.addEventListener('touchend',     function(){ K[code]=false; });
}
mBtn('bL',    'ArrowLeft');
mBtn('bR',    'ArrowRight');
mBtn('bJump', 'Space');
mBtn('bRun',  'ShiftLeft');

// Click anywhere on screens
[sTitle, sOver, sWin, canvas].forEach(function(el) {
  el.addEventListener('click', function(){ initAC(); tryStart(); });
});

// ── Start logic ───────────────────────────────────────────────
function tryStart() {
  if (STATE === 'title' || STATE === 'over' || STATE === 'win') {
    sTitle.classList.remove('on');
    sOver.classList.remove('on');
    sWin.classList.remove('on');
    if (STATE === 'over' || STATE === 'win') {
      score=0; coins=0; lives=3; updateHUD();
    }
    beginGame();
  }
}

function updateHUD() {
  scoreEl.textContent = String(score).padStart(6,'0');
  coinsEl.textContent = '\xD7' + String(coins).padStart(2,'0');
  livesEl.textContent = '\xD7' + String(lives).padStart(2,'0');
}

// ── Level builder ─────────────────────────────────────────────
function buildLevel() {
  var tiles=[], blocks=[], pipes=[], enemies=[], fcoins=[], decos=[];
  var i, tx;

  // GROUND — full width minus two pits
  var pits = [{s:88,e:94},{s:128,e:134}];
  for (tx = 0; tx < WW/TILE; tx++) {
    var inPit = false;
    for (i=0;i<pits.length;i++) { if (tx>=pits[i].s && tx<pits[i].e) { inPit=true; break; } }
    if (!inPit) {
      tiles.push({tx:tx, ty:GY,   k:'top'});
      tiles.push({tx:tx, ty:GY+1, k:'body'});
    }
  }

  // Blocks
  function qb(tx,ty,rw) { blocks.push({tx:tx,ty:ty,k:'q', hit:false,broken:false,reward:rw}); }
  function br(tx,ty)     { blocks.push({tx:tx,ty:ty,k:'br',hit:false,broken:false}); }

  br(16,9);br(17,9);br(18,9); qb(19,9,'coin'); br(20,9);br(21,9);
  qb(22,9,'mushroom'); qb(22,5,'coin');
  br(27,9);br(28,9); qb(29,9,'coin'); br(30,9);
  br(38,6); qb(39,6,'coin'); br(40,6);br(41,6);
  br(50,9);br(51,9);br(52,9);
  br(55,6);br(56,6); qb(57,6,'coin'); br(58,6);br(59,6);
  br(63,9); qb(64,9,'coin'); br(65,9);br(66,9);
  br(75,6); qb(76,6,'star'); br(77,6);
  br(84,9);br(85,9);
  br(98,6);br(99,6);br(100,6);br(101,6);br(102,6);
  br(110,9);br(111,9);br(112,9);

  // Pipes: {tx, h}
  [{tx:12,h:2},{tx:35,h:3},{tx:55,h:4},{tx:73,h:3},{tx:98,h:2},{tx:116,h:2}]
    .forEach(function(p){ pipes.push(p); });

  // Enemies
  [24,36,46,60,78,86,96,110,122,138,150,160].forEach(function(tx) {
    enemies.push({
      x:tx*TILE, y:(GY-1)*TILE, w:24, h:24,
      vx:-1.4, vy:0, onGround:false,
      alive:true, stomped:false, stompTimer:0
    });
  });

  // Free coins
  [25,26,27,40,41,64,65,66,99,100,101].forEach(function(tx) {
    fcoins.push({x:tx*TILE+9, y:(GY-3)*TILE, w:14, h:14, got:false, t:0});
  });

  // Decorations
  [
    [200,'cld'],[600,'mtn'],[900,'cld'],[1200,'cld'],[1500,'mtn'],
    [1900,'cld'],[2400,'mtn'],[2900,'cld'],[3300,'mtn'],[3800,'cld'],
    [4200,'mtn'],[4700,'cld'],[5100,'mtn'],[5600,'cld'],[6000,'mtn']
  ].forEach(function(d){ decos.push({wx:d[0], k:d[1]}); });

  return {tiles:tiles, blocks:blocks, pipes:pipes, enemies:enemies, fcoins:fcoins, decos:decos};
}

// ── AABB ──────────────────────────────────────────────────────
function hit(a,b) {
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

function getSolids() {
  var s = [];
  LVL.tiles.forEach(function(t){
    s.push({x:t.tx*TILE, y:t.ty*TILE, w:TILE, h:TILE});
  });
  LVL.pipes.forEach(function(p){
    for (var i=0;i<p.h;i++){
      s.push({x:p.tx*TILE,     y:(GY-i-1)*TILE, w:TILE, h:TILE});
      s.push({x:(p.tx+1)*TILE, y:(GY-i-1)*TILE, w:TILE, h:TILE});
    }
  });
  LVL.blocks.forEach(function(b){
    if (!b.broken) s.push({x:b.tx*TILE, y:b.ty*TILE, w:TILE, h:TILE, blk:b});
  });
  return s;
}

function moveEnt(e, solids) {
  var i, r;
  // Horizontal
  e.x += e.vx;
  for (i=0;i<solids.length;i++){
    r=solids[i];
    if (hit(e,r)){
      e.x = e.vx>0 ? r.x-e.w : r.x+r.w;
      e.vx=0;
    }
  }
  // Vertical
  e.vy = Math.min(e.vy+GRAV, MFALL);
  e.onGround=false;
  e.y += e.vy;
  for (i=0;i<solids.length;i++){
    r=solids[i];
    if (hit(e,r)){
      if (e.vy>=0){ e.y=r.y-e.h; e.vy=0; e.onGround=true; }
      else        { e.y=r.y+r.h; e.vy=0; if(r.blk) hitBlock(r.blk); }
    }
  }
}

function hitBlock(b) {
  if (b.k==='q' && !b.hit){
    b.hit=true;
    if (b.reward==='coin'){
      coins++; coinsEl.textContent='\xD7'+String(coins).padStart(2,'0');
      addScore(200, b.tx*TILE+16, b.ty*TILE); SFX.coin();
      burst(b.tx*TILE+16, b.ty*TILE, COIN1, 5);
    } else {
      SFX.power();
      PUPS.push({x:b.tx*TILE, y:(b.ty-1)*TILE, w:24, h:24,
                 vx:1.5, vy:-2, onGround:false, k:b.reward, got:false});
    }
  } else if (b.k==='br' && !b.hit){
    if (PLR.big){
      b.broken=true; SFX.brk();
      burst(b.tx*TILE+16, b.ty*TILE, BRICK1, 8);
      addScore(50, b.tx*TILE+16, b.ty*TILE);
    } else {
      SFX.brk(); b.hit=true;
      setTimeout(function(){ b.hit=false; }, 160);
    }
  }
}

function addScore(n, wx, wy) {
  score+=n; scoreEl.textContent=String(score).padStart(6,'0');
  var d=document.createElement('div');
  d.className='pop'; d.textContent=n;
  d.style.left=(wx-camX)+'px'; d.style.top=wy+'px';
  wrapEl.appendChild(d);
  setTimeout(function(){ d.remove(); }, 900);
}

function burst(x,y,color,n) {
  n=n||6;
  for (var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2, sp=2+Math.random()*4;
    PARTS.push({x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-3,
                life:1, color:color, sz:4+Math.random()*4});
  }
}

// ── Player ────────────────────────────────────────────────────
function mkPLR() {
  return {
    x:80, y:(GY-2)*TILE,
    w:24, h:32,
    vx:0, vy:0,
    dir:1, onGround:false,
    big:false,
    inv:false, invT:0,
    star:false, starT:0,
    dead:false,
    wf:0, wt:0
  };
}

function killPLR() {
  if (PLR.inv||PLR.dead) return;
  if (PLR.big){ PLR.big=false; PLR.h=32; PLR.inv=true; PLR.invT=160; SFX.die(); return; }
  PLR.dead=true; PLR.vy=-13; PLR.vx=0;
  STATE='dead'; clearInterval(timerTick); SFX.die();
  setTimeout(function(){
    lives--; updateHUD();
    if (lives<=0){ STATE='over'; sOver.classList.add('on'); }
    else { beginGame(); }
  }, 2500);
}

function beginGame() {
  LVL       = buildLevel();
  PLR       = mkPLR();
  PARTS     = [];
  PUPS      = [];
  flagDone  = false;
  camX      = 0;
  timeLeft  = 400;
  timerEl.textContent = '400';
  STATE     = 'play';
  clearInterval(timerTick);
  timerTick = setInterval(function(){
    if (STATE!=='play') return;
    timeLeft=Math.max(0,timeLeft-1);
    timerEl.textContent=timeLeft;
    if (timeLeft===0) killPLR();
  }, 1000);
}

// ── UPDATE ────────────────────────────────────────────────────
function update() {
  if (STATE==='dead'){
    if (PLR){ PLR.vy+=GRAV; PLR.y+=PLR.vy; }
    return;
  }
  if (STATE!=='play') return;

  var run = K['ShiftLeft']||K['ShiftRight'];
  var maxV = run ? 5.5 : 3.2;

  if (K['ArrowLeft']||K['KeyA']){
    PLR.vx=Math.max(PLR.vx-0.45,-maxV); PLR.dir=-1;
  } else if (K['ArrowRight']||K['KeyD']){
    PLR.vx=Math.min(PLR.vx+0.45,maxV);  PLR.dir=1;
  } else {
    PLR.vx*=0.72;
    if (Math.abs(PLR.vx)<0.1) PLR.vx=0;
  }

  if ((K['Space']||K['ArrowUp']||K['KeyW']) && PLR.onGround){
    PLR.vy = run ? -14 : -13;
    PLR.onGround=false; SFX.jump();
  }

  PLR.x=Math.max(0,PLR.x);

  var solids=getSolids();
  moveEnt(PLR, solids);

  // Walk frame
  if (Math.abs(PLR.vx)>0.3){ PLR.wt++; if(PLR.wt>7){PLR.wf=(PLR.wf+1)%3; PLR.wt=0;} }
  else { PLR.wf=0; }

  if (PLR.inv)  { PLR.invT--;  if(PLR.invT<=0)  PLR.inv=false;  }
  if (PLR.star) { PLR.starT--; if(PLR.starT<=0) PLR.star=false; }

  if (PLR.y>CH+200) killPLR();

  camX=Math.max(0,Math.min(PLR.x-CW/3, WW-CW));

  // Enemies
  for (var ei=0;ei<LVL.enemies.length;ei++){
    var e=LVL.enemies[ei];
    if (!e.alive) continue;
    if (e.stomped){ if(--e.stompTimer<=0) e.alive=false; continue; }
    if (Math.abs(e.x-PLR.x)>CW*1.5) continue;

    var prevVx=e.vx;
    moveEnt(e,solids);
    if (e.vx===0) e.vx=prevVx<0?1.4:-1.4;

    // Edge check
    if (e.onGround){
      var fx=e.x+(e.vx>0?e.w+2:-2), fy=e.y+e.h+2;
      var grnd=false;
      for (var si=0;si<solids.length;si++){
        var sr=solids[si];
        if (fx>=sr.x&&fx<=sr.x+sr.w&&fy>=sr.y&&fy<=sr.y+sr.h+2){grnd=true;break;}
      }
      if (!grnd) e.vx=-e.vx;
    }
    if (e.x<-200){e.alive=false;continue;}

    // Hit player?
    if (!PLR.dead&&!PLR.inv&&hit(PLR,e)){
      if (PLR.vy>0 && PLR.y+PLR.h < e.y+16){
        e.stomped=true; e.stompTimer=28; PLR.vy=-8;
        SFX.stomp(); addScore(200,e.x+12,e.y);
        burst(e.x+12,e.y+8,GOOM1,5);
      } else if (PLR.star){
        e.alive=false; addScore(500,e.x+12,e.y);
        burst(e.x+12,e.y+8,STAR_C,6);
      } else {
        killPLR();
      }
    }
  }

  // Free coins
  for (var fi=0;fi<LVL.fcoins.length;fi++){
    var fc=LVL.fcoins[fi];
    if (fc.got) continue;
    fc.t+=0.12;
    if (hit(PLR,{x:fc.x,y:fc.y,w:fc.w,h:fc.h})){
      fc.got=true; coins++; coinsEl.textContent='\xD7'+String(coins).padStart(2,'0');
      addScore(200,fc.x,fc.y); SFX.coin();
      burst(fc.x+7,fc.y+7,COIN1,4);
    }
  }

  // Power-ups
  for (var pi=0;pi<PUPS.length;pi++){
    var pu=PUPS[pi];
    if (pu.got) continue;
    moveEnt(pu,solids);
    if (pu.vx===0) pu.vx=-(pu.vx)||1.5;
    if (pu.y>CH+100){pu.got=true;continue;}
    if (hit(PLR,pu)){
      pu.got=true;
      if (pu.k==='mushroom'){ PLR.big=true; PLR.h=48; PLR.y-=16; SFX.power(); addScore(1000,pu.x,pu.y); }
      else if (pu.k==='star'){ PLR.star=true; PLR.starT=600; SFX.power(); addScore(1000,pu.x,pu.y); }
    }
  }

  // Particles
  for (var pai=0;pai<PARTS.length;pai++){
    var p=PARTS[pai];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.28; p.life-=0.025;
  }
  PARTS=PARTS.filter(function(p){return p.life>0;});

  // Flag
  var flagX=WW-5*TILE;
  if (!flagDone && PLR.x+PLR.w>flagX){
    flagDone=true; SFX.flag(); addScore(5000,PLR.x,PLR.y);
    setTimeout(function(){
      STATE='win';
      fscoreEl.textContent='SCORE: '+String(score).padStart(6,'0');
      sWin.classList.add('on');
    }, 2200);
  }
}

// ── DRAW ──────────────────────────────────────────────────────
function draw() {
  // Sky — always draw this
  ctx.fillStyle = SKY;
  ctx.fillRect(0,0,CW,CH);

  // If no level loaded yet (title screen), just show a pretty sky + hills
  if (!LVL) {
    drawTitleBg();
    return;
  }

  ctx.save();
  ctx.translate(-Math.floor(camX), 0);

  drawDecos();
  drawGround();
  drawPipes();
  drawBlocks();
  drawFreeCoins();
  drawPups();
  drawEnemies();
  drawFlagPole();
  drawParticles();
  if (STATE==='play'||STATE==='dead') drawMario();

  ctx.restore();
}

// ─ Title screen background ────────────────────────────────────
function drawTitleBg() {
  // Clouds
  drawCloud(80, 60); drawCloud(300, 40); drawCloud(550, 70); drawCloud(720, 50);
  // Mountains
  ctx.fillStyle=MTN1;
  [[0,450],[100,350],[250,410],[420,380],[600,360],[750,420]].forEach(function(m){
    ctx.beginPath(); ctx.moveTo(m[0],450); ctx.lineTo(m[0]+64,m[1]); ctx.lineTo(m[0]+128,450); ctx.closePath(); ctx.fill();
  });
  // Ground
  ctx.fillStyle=GROUND1; ctx.fillRect(0,420,CW,10);
  ctx.fillStyle=GROUND2; ctx.fillRect(0,430,CW,20);
  ctx.fillStyle=GROUND3; ctx.fillRect(0,418,CW,2);
  // Decorative blocks
  var bx, i;
  for (i=0;i<6;i++){
    bx=60+i*100;
    ctx.fillStyle=QBLK1; ctx.fillRect(bx,340,TILE,TILE);
    ctx.fillStyle=QBLK2; ctx.fillRect(bx+2,342,TILE-4,5); ctx.fillRect(bx+2,342,5,TILE-4);
    ctx.fillStyle=QBLK3; ctx.fillRect(bx,340,TILE,2); ctx.fillRect(bx,340+TILE-2,TILE,2); ctx.fillRect(bx,340,2,TILE); ctx.fillRect(bx+TILE-2,340,2,TILE);
    ctx.fillStyle='#fff'; ctx.font='bold 18px monospace'; ctx.textAlign='center';
    ctx.fillText('?',bx+TILE/2,340+TILE/2+7);
  }
  // Pipes
  drawPipeAt(200, 420, 3);
  drawPipeAt(500, 420, 4);
  // Mario standing
  drawSpr(SPR.stand, 120, 390-32, false, false);
  // Goomba
  drawGoomba(400, 396);
}

function drawPipeAt(x, groundY, h) {
  var top=groundY-h*TILE, pw=TILE*2, ph=h*TILE;
  ctx.fillStyle=PIPE1; ctx.fillRect(x+2,top+TILE,pw-4,ph-TILE);
  ctx.fillStyle=PIPE2; ctx.fillRect(x+2,top+TILE,6,ph-TILE);
  ctx.fillStyle=PIPE3; ctx.fillRect(x+pw-8,top+TILE,6,ph-TILE);
  ctx.fillStyle=PIPE1; ctx.fillRect(x,top,pw,TILE);
  ctx.fillStyle=PIPE2; ctx.fillRect(x,top,pw,5); ctx.fillRect(x,top,8,TILE);
  ctx.fillStyle=PIPE3; ctx.fillRect(x+pw-8,top,8,TILE);
}

// ─ Decorations ───────────────────────────────────────────────
function drawDecos() {
  var groundY=GY*TILE;
  for (var i=0;i<LVL.decos.length;i++){
    var d=LVL.decos[i];
    if (d.wx>camX+CW+200||d.wx+200<camX) continue;
    if (d.k==='cld') drawCloud(d.wx, 45+((d.wx*7)%55));
    else drawMtn(d.wx, groundY);
  }
}

function drawCloud(x,y) {
  ctx.fillStyle=CLOUD1;
  [[0,12,20,14],[12,2,22,20],[30,2,22,20],[44,12,20,14]].forEach(function(b){
    ctx.beginPath(); ctx.ellipse(x+b[0]+b[2]/2, y+b[1]+b[3]/2, b[2]/2, b[3]/2, 0,0,Math.PI*2); ctx.fill();
  });
  ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+4,y+18,56,10);
}

function drawMtn(x,y) {
  ctx.fillStyle=MTN1;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+48,y-80); ctx.lineTo(x+96,y); ctx.closePath(); ctx.fill();
  ctx.fillStyle=MTN2;
  ctx.beginPath(); ctx.moveTo(x+34,y-58); ctx.lineTo(x+48,y-80); ctx.lineTo(x+62,y-58); ctx.closePath(); ctx.fill();
}

// ─ Ground ────────────────────────────────────────────────────
function drawGround() {
  for (var i=0;i<LVL.tiles.length;i++){
    var t=LVL.tiles[i];
    var x=t.tx*TILE, y=t.ty*TILE;
    if (x>camX+CW+TILE||x<camX-TILE) continue;
    if (t.k==='top'){
      ctx.fillStyle=GROUND1; ctx.fillRect(x,y,TILE,TILE);
      ctx.fillStyle=GROUND2; ctx.fillRect(x+2,y+7,TILE-4,TILE-7);
      ctx.fillStyle='#f09050'; ctx.fillRect(x,y,TILE,7);
      ctx.fillStyle=GROUND3;
      ctx.fillRect(x,y,1,TILE); ctx.fillRect(x+TILE-1,y,1,TILE);
    } else {
      ctx.fillStyle=GROUND2; ctx.fillRect(x,y,TILE,TILE);
      ctx.fillStyle=GROUND3;
      ctx.fillRect(x,y,1,TILE); ctx.fillRect(x+TILE-1,y,1,TILE);
      ctx.fillRect(x,y,TILE,1); ctx.fillRect(x,y+TILE-1,TILE,1);
    }
  }
}

// ─ Pipes ─────────────────────────────────────────────────────
function drawPipes() {
  for (var i=0;i<LVL.pipes.length;i++){
    var p=LVL.pipes[i];
    var px=p.tx*TILE, top=(GY-p.h)*TILE, bot=GY*TILE;
    if (px>camX+CW+TILE*3||px+TILE*2<camX-TILE) continue;
    var pw=TILE*2, ph=bot-top;
    ctx.fillStyle=PIPE1; ctx.fillRect(px+2,top+TILE,pw-4,ph-TILE);
    ctx.fillStyle=PIPE2; ctx.fillRect(px+2,top+TILE,6,ph-TILE);
    ctx.fillStyle=PIPE3; ctx.fillRect(px+pw-8,top+TILE,6,ph-TILE);
    ctx.fillStyle=PIPE1; ctx.fillRect(px,top,pw,TILE);
    ctx.fillStyle=PIPE2; ctx.fillRect(px,top,pw,5); ctx.fillRect(px,top,8,TILE);
    ctx.fillStyle=PIPE3; ctx.fillRect(px+pw-8,top,8,TILE);
    ctx.strokeStyle='#003800'; ctx.lineWidth=2;
    ctx.strokeRect(px+1,top+1,pw-2,ph-2);
  }
}

// ─ Blocks ────────────────────────────────────────────────────
function drawBlocks() {
  for (var i=0;i<LVL.blocks.length;i++){
    var b=LVL.blocks[i];
    if (b.broken) continue;
    var x=b.tx*TILE, y=b.ty*TILE;
    if (x>camX+CW+TILE||x<camX-TILE) continue;
    if (b.k==='q'){
      if (b.hit){
        ctx.fillStyle=QDEAD; ctx.fillRect(x,y,TILE,TILE);
        ctx.fillStyle='#604020'; ctx.fillRect(x+4,y+4,TILE-8,TILE-8);
      } else {
        ctx.fillStyle=QBLK1; ctx.fillRect(x,y,TILE,TILE);
        ctx.fillStyle=QBLK2; ctx.fillRect(x+2,y+2,TILE-4,5); ctx.fillRect(x+2,y+2,5,TILE-4);
        ctx.fillStyle=QBLK3;
        ctx.fillRect(x,y,TILE,2); ctx.fillRect(x,y+TILE-2,TILE,2);
        ctx.fillRect(x,y,2,TILE); ctx.fillRect(x+TILE-2,y,2,TILE);
        ctx.fillStyle='#fff'; ctx.font='bold 18px monospace'; ctx.textAlign='center';
        ctx.fillText('?',x+TILE/2,y+TILE/2+7);
      }
    } else {
      var by2=b.hit?y-3:y;
      ctx.fillStyle=BRICK1; ctx.fillRect(x,by2,TILE,TILE);
      ctx.fillStyle=BRICK2; ctx.fillRect(x+1,by2+1,TILE-2,4);
      ctx.fillStyle=BRICK3;
      ctx.fillRect(x,by2+TILE/2,TILE,2);
      ctx.fillRect(x+TILE/2,by2,2,TILE/2);
      ctx.fillRect(x,by2+TILE/2+2,TILE/2,TILE/2-2);
    }
  }
}

// ─ Free coins ────────────────────────────────────────────────
function drawFreeCoins() {
  for (var i=0;i<LVL.fcoins.length;i++){
    var fc=LVL.fcoins[i];
    if (fc.got) continue;
    if (fc.x>camX+CW||fc.x<camX-32) continue;
    var cw=Math.abs(Math.cos(fc.t))*12+2;
    ctx.fillStyle=COIN1;
    ctx.beginPath(); ctx.ellipse(fc.x+7,fc.y+7,cw/2,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=COIN2;
    ctx.beginPath(); ctx.ellipse(fc.x+7,fc.y+7,Math.max(1,cw/2-3),4,0,0,Math.PI*2); ctx.fill();
  }
}

// ─ Power-ups ─────────────────────────────────────────────────
function drawPups() {
  for (var i=0;i<PUPS.length;i++){
    var pu=PUPS[i];
    if (pu.got) continue;
    if (pu.k==='mushroom'){
      var x=pu.x, y=pu.y;
      ctx.fillStyle=MSH_W; ctx.fillRect(x+5,y+14,14,10);
      ctx.fillStyle=MSH_R; ctx.beginPath(); ctx.arc(x+12,y+14,12,Math.PI,0); ctx.fill();
      ctx.fillStyle=MSH_W;
      ctx.beginPath(); ctx.arc(x+7,y+10,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+17,y+9,4,0,Math.PI*2); ctx.fill();
    } else if (pu.k==='star'){
      var cx=pu.x+12,cy=pu.y+12,r=12;
      ctx.fillStyle=STAR_C; ctx.beginPath();
      for (var si=0;si<5;si++){
        var a=(si*4*Math.PI/5)-Math.PI/2, b=((si*4+2)*Math.PI/5)-Math.PI/2;
        ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
        ctx.lineTo(cx+Math.cos(b)*r/2,cy+Math.sin(b)*r/2);
      }
      ctx.closePath(); ctx.fill();
    }
  }
}

// ─ Enemies ───────────────────────────────────────────────────
function drawEnemies() {
  for (var i=0;i<LVL.enemies.length;i++){
    var e=LVL.enemies[i];
    if (!e.alive) continue;
    if (e.x>camX+CW+TILE||e.x<camX-TILE) continue;
    if (e.stomped){
      ctx.fillStyle=GOOM1; ctx.fillRect(e.x,e.y+e.h-10,e.w,10);
      ctx.fillStyle=GOOM2; ctx.fillRect(e.x,e.y+e.h-10,e.w,3);
    } else {
      drawGoomba(e.x, e.y);
    }
  }
}

function drawGoomba(x,y) {
  ctx.fillStyle=GOOM1;
  ctx.beginPath(); ctx.arc(x+12,y+13,11,0,Math.PI*2); ctx.fill();
  ctx.fillRect(x+1,y+9,22,15);
  ctx.fillStyle=GOOM2;
  ctx.fillRect(x,y+20,9,6); ctx.fillRect(x+15,y+20,9,6);
  ctx.fillStyle='#fff';
  ctx.fillRect(x+3,y+7,7,7); ctx.fillRect(x+14,y+7,7,7);
  ctx.fillStyle='#000';
  ctx.fillRect(x+3,y+10,4,4); ctx.fillRect(x+17,y+10,4,4);
  ctx.fillStyle=GOOM2;
  ctx.save(); ctx.translate(x+6, y+7); ctx.rotate(-0.35); ctx.fillRect(-5,-2,10,3); ctx.restore();
  ctx.save(); ctx.translate(x+18,y+7); ctx.rotate( 0.35); ctx.fillRect(-5,-2,10,3); ctx.restore();
  ctx.fillStyle='#fff';
  ctx.fillRect(x+6,y+18,4,4); ctx.fillRect(x+14,y+18,4,4);
}

// ─ Flag pole ─────────────────────────────────────────────────
function drawFlagPole() {
  var x=WW-5*TILE, poleTop=GY*TILE-12*TILE;
  ctx.fillStyle=POLE_C; ctx.fillRect(x+6,poleTop,5,12*TILE);
  ctx.fillStyle=COIN1;
  ctx.beginPath(); ctx.arc(x+8,poleTop,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(x+5,poleTop-2,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=FLAG_C;
  ctx.beginPath();
  ctx.moveTo(x+11,poleTop+4); ctx.lineTo(x+42,poleTop+16); ctx.lineTo(x+11,poleTop+28);
  ctx.closePath(); ctx.fill();
}

// ─ Particles ─────────────────────────────────────────────────
function drawParticles() {
  for (var i=0;i<PARTS.length;i++){
    var p=PARTS[i];
    ctx.globalAlpha=Math.max(0,p.life);
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
  }
  ctx.globalAlpha=1;
}

// ─ Mario sprite ──────────────────────────────────────────────
function drawMario() {
  if (!PLR) return;
  if (PLR.inv && Math.floor(Date.now()/65)%2===0) return;

  var flip=PLR.dir<0, rainbow=PLR.star;
  var grid;

  if (PLR.big){
    if (!PLR.onGround&&PLR.vy<0) grid=SPR.bjump;
    else if (PLR.wf===1)         grid=SPR.bwalk;
    else                         grid=SPR.bstand;
  } else {
    if (!PLR.onGround&&PLR.vy<0) grid=SPR.jump;
    else if (PLR.wf===1)         grid=SPR.walk1;
    else if (PLR.wf===2)         grid=SPR.walk2;
    else                         grid=SPR.stand;
  }

  drawSpr(grid, Math.floor(PLR.x), Math.floor(PLR.y), flip, rainbow);
}

// ── MAIN LOOP ─────────────────────────────────────────────────
function loop() {
  try {
    update();
    draw();
  } catch(err) {
    console.error('Game error:', err);
  }
  requestAnimationFrame(loop);
}

// Init HUD and start loop
updateHUD();
requestAnimationFrame(loop);