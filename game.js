// Wendle's tower: rooms, cupboards, a key on the pointer, lock checks, treasure, and now sound!
// Note to self: 'top' is a built-in browser name, so I use towerTop instead!
const canvas = document.getElementById('tower');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');
const again = document.getElementById('again');

const rooms = [
  { name: 'Attic',   wall: '#5b4a7a', cups: [60, 150, 240] },
  { name: 'Library', wall: '#6a4b3a', cups: [40, 200] },
  { name: 'Kitchen', wall: '#4b6a5c', cups: [90, 220] },
  { name: 'Cellar',  wall: '#3f4a5e', cups: [50, 140, 230] }
];

const towerX = 30, towerW = 300, roomH = 128, towerTop = 40;

const cupboards = [];
rooms.forEach((room, i) => {
  const y = towerTop + i * roomH;
  room.cups.forEach(cx => {
    cupboards.push({ x: towerX + cx, y: y + 38, w: 56, h: 76, room: room.name, tried: false, shake: 0, open: false, door: 0, peek: 0 });
  });
});

let rightOne = Math.floor(Math.random() * cupboards.length);
let tries = 0;
let found = false;
let sparkle = 0;

// The key tip sits about 27 px right and 15 px up from the key's middle,
// so I park the key so that its TIP lands right on the pointer.
const TIP_DX = 27, TIP_DY = -15;
const key = { x: 91, y: 131, tx: 91, ty: 131, angle: -0.5, turn: 0 };

// ---- Sound (Web Audio, made only after the first tap) ----
let audio = null;
function getAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}
// a short soft click: a tiny burst of filtered noise
function playClick(vol) {
  const a = getAudio(); if (!a) return;
  const len = Math.floor(a.sampleRate * 0.04);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.2;
  const g = a.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start();
}
// a creak: a wobbly sawtooth squeak, kept quiet
function playCreak(dur, vol) {
  const a = getAudio(); if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(140, t);
  o.frequency.linearRampToValueAtTime(220, t + dur * 0.5);
  o.frequency.linearRampToValueAtTime(170, t + dur);
  const lfo = a.createOscillator(); lfo.frequency.value = 17;
  const lg = a.createGain(); lg.gain.value = 18;
  lfo.connect(lg); lg.connect(o.frequency);
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 4;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.08);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(a.destination);
  o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
}
// a dull little thunk for a wrong cupboard
function playThunk() {
  const a = getAudio(); if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  const g = a.createGain();
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + 0.16);
}

function drawRoom(room, i) {
  const y = towerTop + i * roomH;
  ctx.fillStyle = room.wall;
  ctx.fillRect(towerX, y, towerW, roomH);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let by = y + 15; by < y + roomH; by += 15) {
    ctx.beginPath(); ctx.moveTo(towerX, by); ctx.lineTo(towerX + towerW, by); ctx.stroke();
  }
  ctx.fillStyle = '#2a1f18';
  ctx.fillRect(towerX, y + roomH - 10, towerW, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(room.name, towerX + 8, y + 16);
}

function keyhole(c) { return { x: c.x + c.w / 2, y: c.y + c.h / 2 }; }
function tip() {
  return { x: key.x + Math.cos(key.angle) * 31, y: key.y + Math.sin(key.angle) * 31 };
}
function nearest() {
  const t = tip();
  let best = null, bd = 30;
  cupboards.forEach((c, i) => {
    const k = keyhole(c);
    const d = Math.hypot(k.x - t.x, k.y - t.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

function drawTreasure(c) {
  const cx = c.x + c.w / 2, cy = c.y + c.h - 18;
  const bob = Math.sin(sparkle * 0.1) * 2;
  ctx.fillStyle = '#7a2e5a';
  ctx.fillRect(c.x + 6, c.y + c.h - 14, c.w - 12, 8);
  ctx.fillStyle = '#e8b93f';
  ctx.strokeStyle = '#7a5a10';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx - 9, cy + bob, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5a10';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('$', cx - 9, cy + 4 + bob);
  ctx.fillStyle = '#4fe0a0';
  ctx.strokeStyle = '#1b7a55';
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy - 9 + bob); ctx.lineTo(cx + 17, cy - 1 + bob);
  ctx.lineTo(cx + 9, cy + 7 + bob); ctx.lineTo(cx + 1, cy - 1 + bob);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let s = 0; s < 4; s++) {
    const a = sparkle * 0.05 + s * 1.6;
    const px = cx + Math.cos(a) * 22, py = cy - 14 + Math.sin(a * 1.3) * 12;
    const r = 1.5 + Math.abs(Math.sin(a * 2)) * 2;
    ctx.fillStyle = '#fff6c0';
    ctx.fillRect(px - r, py - 0.5, r * 2, 1);
    ctx.fillRect(px - 0.5, py - r, 1, r * 2);
  }
  ctx.textAlign = 'left';
}

function drawCupboard(c, i, hot) {
  ctx.save();
  if (c.shake > 0) ctx.translate(Math.sin(c.shake * 1.5) * c.shake * 0.4, 0);
  if (c.door > 0.01) {
    ctx.fillStyle = '#1c0f06';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    if (i === rightOne && c.open) drawTreasure(c);
  }
  const hw = c.w / 2;
  const open = c.door;
  const dw = hw * (1 - open * 0.85);
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(c.x, c.y, dw, c.h);
  ctx.fillRect(c.x + c.w - dw, c.y, dw, c.h);
  ctx.strokeStyle = hot && !c.open ? '#ffe28a' : '#4a2c14';
  ctx.lineWidth = hot && !c.open ? 4 : 3;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x, c.y, dw, c.h);
  ctx.strokeRect(c.x + c.w - dw, c.y, dw, c.h);
  if (open < 0.3) {
    ctx.fillStyle = hot ? '#fff0b0' : '#d9a93a';
    ctx.beginPath(); ctx.arc(c.x + hw, c.y + c.h / 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1a08';
    ctx.beginPath(); ctx.arc(c.x + hw, c.y + c.h / 2 - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(c.x + hw - 1, c.y + c.h / 2, 2, 4);
  }
  if (c.tried && !c.open) {
    ctx.strokeStyle = '#e0584a';
    ctx.lineWidth = 3;
    const cx = c.x + hw, cy = c.y + 14;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
    ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5); ctx.stroke();
  }
  if (c.open) {
    ctx.fillStyle = '#7bd88f';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK!', c.x + hw, c.y - 6);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function drawRoof() {
  ctx.fillStyle = '#7a2e3a';
  ctx.beginPath();
  ctx.moveTo(towerX - 14, towerTop);
  ctx.lineTo(towerX + towerW / 2, 2);
  ctx.lineTo(towerX + towerW + 14, towerTop);
  ctx.closePath();
  ctx.fill();
}

function drawKey() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(key.x + 4, key.y + 8, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(key.x, key.y);
  ctx.rotate(key.angle + key.turn);
  ctx.strokeStyle = '#7a5a10';
  ctx.fillStyle = '#e8b93f';
  ctx.lineWidth = 2;
  ctx.fillRect(0, -2.5, 30, 5);
  ctx.strokeRect(0, -2.5, 30, 5);
  ctx.fillRect(22, 2.5, 4, 6); ctx.strokeRect(22, 2.5, 4, 6);
  ctx.fillRect(28, 2.5, 3, 4); ctx.strokeRect(28, 2.5, 3, 4);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e8b93f';
  ctx.beginPath(); ctx.arc(-7, 0, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#7a5a10';
  ctx.beginPath(); ctx.arc(-7, 0, 9.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoof();
  rooms.forEach(drawRoom);
  const hot = nearest();
  cupboards.forEach((c, i) => drawCupboard(c, i, i === hot));
  ctx.strokeStyle = '#1a1226';
  ctx.lineWidth = 4;
  ctx.strokeRect(towerX, towerTop, towerW, roomH * rooms.length);
  drawKey();
}

// the pointer is where the key TIP should be
function setTarget(e) {
  const r = canvas.getBoundingClientRect();
  key.tx = (e.clientX - r.left) * canvas.width / r.width - TIP_DX;
  key.ty = (e.clientY - r.top) * canvas.height / r.height - TIP_DY;
}

function tryKey() {
  if (found) return;
  const i = nearest();
  key.turn = 0.8;
  if (i === null) {
    playClick(0.15);
    msg.textContent = 'Nothing to unlock there. Bring the key tip to a keyhole (the cupboard glows)!';
    return;
  }
  const c = cupboards[i];
  tries++;
  if (i === rightOne) {
    c.open = true;
    found = true;
    // the lovely sound: click first, then a slow creak of the doors
    playClick(0.4);
    setTimeout(() => playCreak(0.9, 0.07), 120);
    msg.textContent = 'Click! The ' + c.room + ' cupboard opens after ' + tries + (tries === 1 ? ' try' : ' tries') + ' - a coin and a gem! Treasure!';
    again.hidden = false;
  } else {
    c.tried = true;
    c.shake = 12;
    c.peek = 25; // doors rattle open a crack, showing only darkness
    playThunk();
    playClick(0.12);
    msg.textContent = 'Rattle... the ' + c.room + ' cupboard is not the one.' + (tries >= 4 ? ' Hint: I think the treasure sleeps in the ' + cupboards[rightOne].room + '!' : ' Try again!');
  }
}

again.addEventListener('click', () => {
  cupboards.forEach(c => { c.open = false; c.tried = false; c.door = 0; c.shake = 0; c.peek = 0; });
  rightOne = Math.floor(Math.random() * cupboards.length);
  tries = 0; found = false;
  again.hidden = true;
  playClick(0.15);
  msg.textContent = 'The treasure is hidden again. Find the right cupboard!';
});

canvas.addEventListener('pointermove', setTarget);
canvas.addEventListener('pointerdown', e => { setTarget(e); tryKey(); });

function loop() {
  const dx = key.tx - key.x, dy = key.ty - key.y;
  key.x += dx * 0.3;
  key.y += dy * 0.3;
  // keep the tilt almost constant so the tip stays right on the pointer
  const want = -0.5 + Math.max(-0.1, Math.min(0.1, dx * 0.01));
  key.angle += (want - key.angle) * 0.15;
  key.turn *= 0.9;
  cupboards.forEach(c => {
    if (c.shake > 0) c.shake -= 0.5;
    if (c.peek > 0) c.peek--;
    const goal = c.open ? 1 : (c.peek > 0 ? 0.3 : 0);
    c.door += (goal - c.door) * 0.15;
  });
  sparkle++;
  draw();
  requestAnimationFrame(loop);
}
loop();
