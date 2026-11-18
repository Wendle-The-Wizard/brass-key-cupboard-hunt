// Wendle's tower: drawing the rooms and cupboards first.
const canvas = document.getElementById('tower');
const ctx = canvas.getContext('2d');

// Four rooms stacked up the tower, each with its own wall colour.
// Cupboards are listed as x positions inside the room (width 56).
const rooms = [
  { name: 'Attic',   wall: '#5b4a7a', cups: [60, 150, 240] },
  { name: 'Library', wall: '#6a4b3a', cups: [40, 200] },
  { name: 'Kitchen', wall: '#4b6a5c', cups: [90, 220] },
  { name: 'Cellar',  wall: '#3f4a5e', cups: [50, 140, 230] }
];

const towerX = 30, towerW = 300, roomH = 120, top = 40;

// Keep all cupboards in a list so later steps can test them with the key.
const cupboards = [];

function drawRoom(room, i) {
  const y = top + i * roomH;
  // wall
  ctx.fillStyle = room.wall;
  ctx.fillRect(towerX, y, towerW, roomH);
  // brick lines for a stony feel
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let by = y + 15; by < y + roomH; by += 15) {
    ctx.beginPath(); ctx.moveTo(towerX, by); ctx.lineTo(towerX + towerW, by); ctx.stroke();
  }
  // floor
  ctx.fillStyle = '#2a1f18';
  ctx.fillRect(towerX, y + roomH - 10, towerW, 10);
  // room name
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px Georgia';
  ctx.fillText(room.name, towerX + 8, y + 16);
  // cupboards sit on the floor
  room.cups.forEach(cx => {
    const c = { x: towerX + cx, y: y + 34, w: 56, h: 76, room: room.name };
    cupboards.push(c);
    drawCupboard(c);
  });
}

function drawCupboard(c) {
  // wooden body
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 3;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  // two doors with a seam in the middle
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x + c.w / 2, c.y); ctx.lineTo(c.x + c.w / 2, c.y + c.h); ctx.stroke();
  // little panels
  ctx.strokeStyle = '#6b4222';
  ctx.strokeRect(c.x + 6, c.y + 8, c.w / 2 - 12, c.h - 16);
  ctx.strokeRect(c.x + c.w / 2 + 6, c.y + 8, c.w / 2 - 12, c.h - 16);
  // brass keyhole plate
  ctx.fillStyle = '#d9a93a';
  ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a08';
  ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(c.x + c.w / 2 - 1, c.y + c.h / 2, 2, 4);
}

function drawRoof() {
  ctx.fillStyle = '#7a2e3a';
  ctx.beginPath();
  ctx.moveTo(towerX - 14, top);
  ctx.lineTo(towerX + towerW / 2, 2);
  ctx.lineTo(towerX + towerW + 14, top);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cupboards.length = 0;
  drawRoof();
  rooms.forEach(drawRoom);
  // tower outline
  ctx.strokeStyle = '#1a1226';
  ctx.lineWidth = 4;
  ctx.strokeRect(towerX, top, towerW, roomH * rooms.length);
}

draw();
