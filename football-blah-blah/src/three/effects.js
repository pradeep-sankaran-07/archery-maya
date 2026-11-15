import * as THREE from 'three';

const MAX = 700;
const COLORS = [0xff5a5f, 0xffa94a, 0xffc94a, 0x4caf50, 0x4a90e2, 0x8b5fbf, 0xff7eb3, 0xffffff];

/** One pooled particle system for confetti, sparkles and smoke. */
export class Particles {
  constructor(scene) {
    this.geo = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(this.geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false }), MAX);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.p = [];
    for (let i = 0; i < MAX; i++) this.p.push({ life: 0 });
    this.next = 0;
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
    this.s = new THREE.Vector3();
    this.v = new THREE.Vector3();
    this.c = new THREE.Color();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX; i++) { this.mesh.setMatrixAt(i, zero); this.mesh.setColorAt(i, this.c.setHex(0xffffff)); }
    scene.add(this.mesh);
  }

  spawn(o) {
    const idx = this.next;
    const p = this.p[idx];
    this.next = (idx + 1) % MAX;
    Object.assign(p, {
      x: o.x, y: o.y, z: o.z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
      life: o.life || 2, max: o.life || 2, size: o.size || 0.15, grow: o.grow || 0,
      g: o.g ?? 6, drag: o.drag ?? 1.2, rx: Math.random() * 6, ry: Math.random() * 6, spin: (Math.random() - 0.5) * 12,
      flutter: o.flutter ?? 0,
    });
    this.mesh.setColorAt(idx, this.c.setHex(o.color ?? COLORS[(Math.random() * COLORS.length) | 0]));
    this.mesh.instanceColor.needsUpdate = true;
  }

  confetti(x, y, z, n = 120, spread = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * spread;
      this.spawn({ x, y, z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 4 + Math.random() * 7, life: 2.5 + Math.random(), size: 0.18, g: 5, drag: 1.4, flutter: 1 });
    }
  }

  firework(x, y, z, color) {
    const col = color ?? COLORS[(Math.random() * COLORS.length) | 0];
    for (let i = 0; i < 50; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const sp = 6 + Math.random() * 2;
      this.spawn({ x, y, z, vx: r * Math.cos(a) * sp, vy: u * sp, vz: r * Math.sin(a) * sp, life: 1.3, size: 0.25, g: 2, drag: 1.5, color: col });
    }
  }

  sparkle(x, y, z, color = 0xffe066, n = 3) {
    for (let i = 0; i < n; i++) {
      this.spawn({ x: x + (Math.random() - 0.5) * 0.3, y: y + (Math.random() - 0.5) * 0.3, z: z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5), vy: Math.random() * 1.5, vz: (Math.random() - 0.5), life: 0.7, size: 0.16, g: 0, drag: 2, color });
    }
  }

  smoke(x, y, z, n = 25) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawn({ x, y, z, vx: Math.cos(a) * 2, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 2, life: 1.2, size: 0.5, grow: 1.5, g: -0.5, drag: 2, color: 0xdddddd });
    }
  }

  update(dt) {
    const { m, q, e, s } = this;
    for (let i = 0; i < MAX; i++) {
      const p = this.p[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, m); continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vz *= d; p.vy = p.vy * d - p.g * dt;
      if (p.flutter) { p.vx += Math.sin(p.life * 7 + i) * dt * 2; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.03) { p.y = 0.03; p.vy = 0; p.vx *= 0.5; p.vz *= 0.5; }
      p.rx += p.spin * dt; p.ry += p.spin * 0.7 * dt;
      const k = Math.min(1, p.life / (p.max * 0.3));
      const size = (p.size + p.grow * (1 - p.life / p.max)) * k;
      q.setFromEuler(e.set(p.rx, p.ry, 0));
      s.set(size, size, size);
      m.compose(this.v.set(p.x, p.y, p.z), q, s);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
