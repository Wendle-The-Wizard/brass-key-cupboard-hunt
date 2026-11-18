// Wendle's tower: rooms, cupboards, a key that follows the pointer, and now lock checks!
// Note to self: 'top' is a built-in browser name, so I use towerTop instead!
const canvas = document.getElementById('tower');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');

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
    cupboards.push({ x: towerX + cx, y: y + 38, w: 56, h: 76, room: room.name, tried: false, shake: 0, open: false });
  });
});

// One cupboard is secretly the right one. The treasure comes in step 4.
const rightOne = Math.floor(Math.random() * cupboards.length);
let tries = 0;

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
  ctx.fillText(room.name, towerX + 8, y + 16);
}

// Is the key tip close to this cupboard's keyhole?
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

function drawCupboard(c, i, hot) {
  ctx.save();
  if (c.shake > 0) ctx.translate(Math.sin(c.shake * 1.5) * c.shake * 0.4, 0);
  ctx.fillStyle = c.open ? '#a9783f' : '#8a5a32';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = hot ? '#ffe28a' : '#4a2c14';
  ctx.lineWidth = 3;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x + c.w / 2, c.y); ctx.lineTo(c.x + c.w / 2, c.y + c.h); ctx.stroke();
  ctx.strokeStyle = '#6b4222';
  ctx.strokeRect(c.x + 6, c.y + 8, c.w / 2 - 12, c.h - 16);
  ctx.strokeRect(c.x + c.w / 2 + 6, c.y + 8, c.w / 2 - 12, c.h - 16);
  ctx.fillStyle = hot ? '#fff0b0' : '#d9a93a';
  ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a08';
  ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(c.x + c.w / 2 - 1, c.y + c.h / 2, 2, 4);
  if (c.tried && !c.open) {
    // a little red x for "wrong lock"
    ctx.strokeStyle = '#e0584a';
    ctx.lineWidth = 3;
    const cx = c.x + c.w / 2, cy = c.y + 14;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
    ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5); ctx.stroke();
  }
  if (c.open) {
    ctx.fillStyle = '#7bd88f';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK!', c.x + c.w / 2, c.y + 20);
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
  const i = nearest();
  key.turn = 0.5;
  if (i === null) { msg.textContent = 'Nothing to unlock there. Bring the key tip to a keyhole!'; return; }
  const c = cupboards[i];
  if (c.open) return;
  tries++;
  if (i === rightOne) {
    c.open = true;
    msg.textContent = 'Click! The ' + c.room + ' cupboard opens after ' + tries + (tries === 1 ? ' try!' : ' tries!');
  } else {
    c.tried = true;
    c.shake = 12;
    msg.textContent = 'Rattle... the ' + c.room + ' cupboard is not the one. Try again!';
  }
}

canvas.addEventListener('pointermove', setTarget);
canvas.addEventListener('pointerdown', e => { setTarget(e); tryKey(); });

function loop() {
  const dx = key.tx - key.x, dy = key.ty - key.y;
  key.x += dx * 0.25;
  key.y += dy * 0.25;
  const want = -0.5 + Math.max(-0.6, Math.min(0.6, dx * 0.03));
  key.angle += (want - key.angle) * 0.15;
  key.turn *= 0.9;
  cupboards.forEach(c => { if (c.shake > 0) c.shake -= 0.5; });
  draw();
  requestAnimationFrame(loop);
}
loop();
