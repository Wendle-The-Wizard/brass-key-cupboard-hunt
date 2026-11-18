// Wendle's tower: rooms, cupboards, a key that follows the pointer, lock checks, and now treasure!
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
    cupboards.push({ x: towerX + cx, y: y + 38, w: 56, h: 76, room: room.name, tried: false, shake: 0, open: false, door: 0 });
  });
});

// One cupboard is secretly the right one, and the treasure sleeps inside.
let rightOne = Math.floor(Math.random() * cupboards.length);
let tries = 0;
let found = false;
let sparkle = 0; // grows while the treasure glitters

// The key starts parked at the middle of the tower, and a wiggle shows it is carried.
const key = { x: 180, y: 300, tx: 180, ty: 300, angle: -0.5, turn: 0 };

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
  let best = null, bd = 28;
  cupboards.forEach((c, i) => {
    const k = keyhole(c);
    const d = Math.hypot(k.x - t.x, k.y - t.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

// A small treasure: a gold coin and a green gem on a velvet cushion
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
  // twinkles
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
  // inside of the cupboard, seen when the doors swing open
  if (c.door > 0.01) {
    ctx.fillStyle = '#1c0f06';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    if (i === rightOne) drawTreasure(c);
  }
  const hw = c.w / 2;
  const open = c.door;
  const dw = hw * (1 - open * 0.85); // doors squash narrow as they swing
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(c.x, c.y, dw, c.h);
  ctx.fillRect(c.x + c.w - dw, c.y, dw, c.h);
  ctx.strokeStyle = hot && !c.open ? '#ffe28a' : '#4a2c14';
  ctx.lineWidth = 3;
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
  // soft shadow so the key looks held above the tower
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

function setTarget(e) {
  const r = canvas.getBoundingClientRect();
  key.tx = (e.clientX - r.left) * canvas.width / r.width;
  key.ty = (e.clientY - r.top) * canvas.height / r.height;
}

// The lock check: turn the key in whichever keyhole is under the tip.
function tryKey() {
  if (found) return;
  const i = nearest();
  key.turn = 0.8;
  if (i === null) { msg.textContent = 'Nothing to unlock there. Bring the key tip to a keyhole!'; return; }
  const c = cupboards[i];
  tries++;
  if (i === rightOne) {
    c.open = true;
    found = true;
    msg.textContent = 'Click! The ' + c.room + ' cupboard opens after ' + tries + (tries === 1 ? ' try' : ' tries') + ' - a coin and a gem! Treasure!';
    again.hidden = false;
  } else {
    c.tried = true;
    c.shake = 12;
    msg.textContent = 'Rattle... the ' + c.room + ' cupboard is not the one. Try again!';
  }
}

// Start a fresh hunt with the treasure somewhere new
again.addEventListener('click', () => {
  cupboards.forEach(c => { c.open = false; c.tried = false; c.door = 0; c.shake = 0; });
  rightOne = Math.floor(Math.random() * cupboards.length);
  tries = 0; found = false;
  again.hidden = true;
  msg.textContent = 'The treasure is hidden again. Find the right cupboard!';
});

canvas.addEventListener('pointermove', setTarget);
canvas.addEventListener('pointerdown', e => { setTarget(e); tryKey(); });

function loop() {
  const dx = key.tx - key.x, dy = key.ty - key.y;
  key.x += dx * 0.25;
  key.y += dy * 0.25;
  const want = -0.5 + Math.max(-0.6, Math.min(0.6, dx * 0.03));
  key.angle += (want - key.angle) * 0.15;
  key.turn *= 0.9;
  cupboards.forEach(c => {
    if (c.shake > 0) c.shake -= 0.5;
    const goal = c.open ? 1 : 0;
    c.door += (goal - c.door) * 0.15;
  });
  sparkle++;
  draw();
  requestAnimationFrame(loop);
}
loop();
