// Lightweight confetti on a full-screen canvas.
const COLORS = ['#ff5a5f', '#ffc94a', '#4caf50', '#4a90e2', '#8b5fbf', '#ff7eb3', '#40d8ff'];
let canvas = null, ctx = null, parts = [], running = false;

function setup() {
  canvas = document.getElementById('confetti');
  ctx = canvas.getContext('2d');
  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener('resize', fit);
}

export function confetti(n = 120) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) n = Math.min(n, 30);
  if (!canvas) setup();
  const w = innerWidth;
  for (let i = 0; i < n; i++) {
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16,
      vy: -6 - Math.random() * 12,
      r: 4 + Math.random() * 6,
      a: Math.random() * Math.PI,
      va: (Math.random() - 0.5) * 0.4,
      c: COLORS[i % COLORS.length],
      life: 0,
      star: Math.random() < 0.15,
    });
  }
  if (!running) { running = true; requestAnimationFrame(step); }
}

function step() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 260);
  for (const p of parts) {
    p.life++;
    p.vy += 0.35; p.vx *= 0.985; p.vy *= 0.985;
    p.x += p.vx; p.y += p.vy; p.a += p.va;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.a);
    ctx.fillStyle = p.c;
    if (p.star) { ctx.font = `${p.r * 3}px serif`; ctx.fillText('⭐', -p.r, p.r); }
    else ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r * Math.abs(Math.cos(p.life / 6)) + 1);
    ctx.restore();
  }
  if (parts.length) requestAnimationFrame(step);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
