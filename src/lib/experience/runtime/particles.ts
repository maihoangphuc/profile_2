import { rootCssVarToRgba } from "@/utils/rootCssColor";
import { Dom } from "@/lib/experience/runtime/types";

export type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  op: number;
  seed: number;
};

export function createParticlesState() {
  return {
    particles: [] as Particle[],
  };
}

export function resizeParticles(dom: Dom) {
  dom.particles.width = innerWidth;
  dom.particles.height = innerHeight;
}

export function initParticles(dom: Dom, state: { particles: Particle[] }) {
  resizeParticles(dom);
  state.particles = [];
  const count = Math.floor((innerWidth * innerHeight) / 15000);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (innerWidth * 0.05) + 10;
    const isLeft = Math.random() > 0.5;
    state.particles.push({
      x: innerWidth / 2 + Math.cos(angle) * radius,
      y: innerHeight * 0.55 + (Math.random() - 0.5) * (innerHeight * 0.15),
      r: Math.random() * 0.5 + 0.2,
      vx: (isLeft ? -1 : 1) * (Math.random() * 0.3 + 0.05),
      vy: -Math.random() * 0.4 - 0.15,
      op: Math.random() * 0.5 + 0.1,
      seed: Math.random() * 100,
    });
  }
}

export function drawParticles(dom: Dom, ctx: CanvasRenderingContext2D, state: { particles: Particle[] }) {
  const pCanvas = dom.particles;
  ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, pCanvas.width, pCanvas.height - 60);
  ctx.clip();
  for (const p of state.particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = rootCssVarToRgba("--color-web-accent", p.op);
    ctx.fill();
    p.x += p.vx + Math.sin(p.y * 0.02 + p.seed) * 0.6;
    p.y += p.vy + Math.cos(p.x * 0.02 + p.seed) * 0.3;
    p.op -= 0.00015;
    if (p.y < pCanvas.height * 0.05) p.op -= 0.02;
    if (p.op <= 0 || p.y < -10 || p.x < -50 || p.x > pCanvas.width + 50) {
      p.y =
        pCanvas.height * 0.55 +
        (Math.random() - 0.5) * (pCanvas.height * 0.15);
      p.x =
        pCanvas.width / 2 + (Math.random() - 0.5) * (pCanvas.width * 0.15);
      p.op = Math.random() * 0.4 + 0.1;
      p.seed = Math.random() * 100;
    }
  }
  ctx.restore();
}
