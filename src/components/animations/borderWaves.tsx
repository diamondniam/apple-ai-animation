"use client";

import { useEffect, useState } from "react";
import { GeneratedGradient, GradientState, Props, Wave } from "./types";
import { getRandomInt, lerp, lerpColor, rgbaToArray } from "@/utils";

export default function BorderWaves(props: Props) {
  const [canvas, setCanvas] = useState<Canvas>();

  useEffect(() => {
    setCanvas(new Canvas());
    window.addEventListener("resize", resizeHandler);
  }, []);

  const resizeHandler = () => {
    setCanvas(new Canvas());
  };

  const defaults = {
    lineWidth: 7,
    radius: 20,
    pointsPerMaxEdge: 50,
    waveLength: { min: 10, max: 20 },
    waveAmplitude: { min: 10, max: 20 },
    waveDuration: { min: 1, max: 2 },
    waveSpawnInterval: 0.3,
    gradientInterval: 0.5,
  };

  useEffect(() => {
    if (canvas) {
      canvas.lineWidth = props.lineWidth || defaults.lineWidth;
      canvas.radius = props.radius || defaults.radius;
      canvas.pointsPerMaxEdge =
        props.pointsPerMaxEdge || defaults.pointsPerMaxEdge;
      canvas.waveLength = {
        min: props.waveLength?.min || defaults.waveLength.min,
        max: props.waveLength?.max || defaults.waveLength.max,
      };
      canvas.waveAmplitude = {
        min: props.waveAmplitude?.min || defaults.waveAmplitude.min,
        max: props.waveAmplitude?.max || defaults.waveAmplitude.max,
      };
      canvas.waveSpawnInterval =
        props.waveSpawnInterval || defaults.waveSpawnInterval;
      canvas.gradientInterval =
        props.gradientInterval || defaults.gradientInterval;
    }
  }, [
    props.waveLength,
    props.waveAmplitude,
    props.waveSpawnInterval,
    props.lineWidth,
    props.pointsPerMaxEdge,
    props.radius,
  ]);

  class Canvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = performance.now();
    private waves: Wave[] = [];
    private tGlobal: number = 0;
    private waveSpawnTimer = 0;
    waveSpawnInterval = props.waveSpawnInterval || defaults.waveSpawnInterval;
    waveLength: { min: number; max: number } = {
      min: props.waveLength?.min || defaults.waveLength.min,
      max: props.waveLength?.max || defaults.waveLength.max,
    };
    waveAmplitude: { min: number; max: number } = {
      min: props.waveAmplitude?.min || defaults.waveAmplitude.min,
      max: props.waveAmplitude?.max || defaults.waveAmplitude.max,
    };
    waveDuration: { min: number; max: number } = {
      min: defaults.waveDuration.min,
      max: defaults.waveDuration.max,
    };
    private blurTimer = 0;
    private blurInterval = 2;
    private gradientTimer = 0;
    gradientInterval = props.gradientInterval || defaults.gradientInterval;
    private maxBlurSize = 60;

    lineWidth = props.lineWidth || defaults.lineWidth;
    radius = props.radius || defaults.radius;
    pointsPerMaxEdge = props.pointsPerMaxEdge || defaults.pointsPerMaxEdge;

    width = props.width || window.innerWidth;
    height = props.height || window.innerHeight;

    private border: {
      x: number;
      y: number;
      nx: number;
      ny: number;
      px: number;
      py: number;
    }[] = [];
    private blurs: [number, number] = [0, 0];
    private gradients: GeneratedGradient[] = [];

    constructor() {
      this.canvas = document.getElementById("modalCanvas") as HTMLCanvasElement;
      this.ctx = this.canvas.getContext("2d")!;

      this.canvas.width = this.width;
      this.canvas.height = this.height;

      const rawBorder = this.getRoundedRectPath(
        0,
        0,
        this.width,
        this.height,
        this.radius,
        this.pointsPerMaxEdge
      );

      this.border = rawBorder.map((p) => ({ ...p, px: p.x, py: p.y }));
      this.blurs = [0, getRandomInt(0, this.maxBlurSize)];
      this.gradients = [this.generateGradient(), this.generateGradient()];

      this.animate(0);
    }

    lerpGradient(
      from: GeneratedGradient,
      to: GeneratedGradient,
      t: number
    ): GeneratedGradient {
      let gradient: GradientState = [];
      gradient = from.gradient.map((stop, i) => ({
        offset: stop.offset,
        color: lerpColor(stop.color, to.gradient[i].color, t),
      }));

      return {
        gradient,
        mainColor: lerpColor(from.mainColor, to.mainColor, t),
      };
    }

    generateGradient(): {
      gradient: GradientState;
      mainColor: [number, number, number, number];
    } {
      const baseHue = getRandomInt(0, 360);
      const scheme = getRandomInt(1, 2); // 0: analog, 1: triadic, 2: split-comp
      const hueOffsets =
        scheme === 0
          ? [0, 20, 40] // Analogous
          : scheme === 1
          ? [0, 120, 240] // Triadic
          : [0, 150, 210]; // Split-Complementary

      const saturation = getRandomInt(80, 100); // more color-rich
      const lightness = getRandomInt(60, 80); // medium-bright

      const hslToRgba = (
        h: number,
        s: number,
        l: number,
        a: number
      ): [number, number, number, number] => {
        s /= 100;
        l /= 100;
        const k = (n: number) => (n + h / 30) % 12;
        const a_ = s * Math.min(l, 1 - l);
        const f = (n: number) =>
          l - a_ * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [
          Math.round(255 * f(0)),
          Math.round(255 * f(8)),
          Math.round(255 * f(4)),
          a,
        ];
      };

      const colorStops: GradientState = hueOffsets.map((hOffset, i) => ({
        offset: i / (hueOffsets.length - 1),
        color: hslToRgba(
          (baseHue + hOffset) % 360,
          saturation + getRandomInt(-5, 5),
          lightness + getRandomInt(-5, 5),
          getRandomInt(70, 100) / 100
        ),
      }));

      const [r, g, b] = colorStops[1].color;
      const mainColor: [number, number, number, number] = [
        Math.round(r),
        Math.round(g),
        Math.round(b),
        1,
      ];

      return {
        gradient: colorStops,
        mainColor,
      };
    }

    applyGradient(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      gradientState: GradientState,
      A?: number
    ) {
      const grad = this.ctx.createLinearGradient(x0, y0, x1, y1);
      for (const stop of gradientState) {
        const [r, g, b, a] = stop.color;
        grad.addColorStop(
          stop.offset,
          `rgba(${r}, ${g}, ${b}, ${A !== undefined ? A : a})`
        );
      }
      return grad;
    }

    getRoundedRectPath(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      pointsPerMaxEdge: number
    ) {
      w = w - this.lineWidth * 2;
      h = h - this.lineWidth * 2;
      x = x + this.lineWidth;
      y = y + this.lineWidth;
      const maxEdge = Math.max(w, h);

      const pointsHorizontal = Math.round((w / maxEdge) * pointsPerMaxEdge);
      const pointsVertical = Math.round((h / maxEdge) * pointsPerMaxEdge);
      const arcLength = (Math.PI / 2) * r;
      const pointsArc = Math.max(
        3,
        Math.round((arcLength / maxEdge) * pointsPerMaxEdge)
      );

      const path: { x: number; y: number; nx: number; ny: number }[] = [];

      const corners = [
        { cx: x + r, cy: y + r, startAngle: Math.PI, endAngle: 1.5 * Math.PI },
        {
          cx: x + w - r,
          cy: y + r,
          startAngle: 1.5 * Math.PI,
          endAngle: 2 * Math.PI,
        },
        {
          cx: x + w - r,
          cy: y + h - r,
          startAngle: 0,
          endAngle: 0.5 * Math.PI,
        },
        {
          cx: x + r,
          cy: y + h - r,
          startAngle: 0.5 * Math.PI,
          endAngle: Math.PI,
        },
      ];

      const linearSegments = [
        { from: [x + r, y], to: [x + w - r, y], nx: 0, ny: -1 },
        { from: [x + w, y + r], to: [x + w, y + h - r], nx: 1, ny: 0 },
        { from: [x + w - r, y + h], to: [x + r, y + h], nx: 0, ny: 1 },
        { from: [x, y + h - r], to: [x, y + r], nx: -1, ny: 0 },
      ];

      for (let i = 0; i < 4; i++) {
        const { cx, cy, startAngle, endAngle } = corners[i];
        for (let j = 0; j < pointsArc; j++) {
          const t = j / pointsArc;
          const angle = lerp(startAngle, endAngle, t);
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          const nx = Math.cos(angle);
          const ny = Math.sin(angle);
          path.push({ x: px, y: py, nx, ny });
        }

        const { from, to, nx, ny } = linearSegments[i];
        const points = (i + 1) % 2 === 0 ? pointsVertical : pointsHorizontal;
        for (let j = 0; j < points; j++) {
          const t = j / points;
          const px = lerp(from[0], to[0], t);
          const py = lerp(from[1], to[1], t);
          path.push({ x: px, y: py, nx, ny });
        }
      }

      return path;
    }
    computeAnimatedNormals(points: { px: number; py: number }[]) {
      let result = [];
      const count = points.length;

      for (let i = 0; i < count; i++) {
        const prev = points[(i - 1 + count) % count];
        const next = points[(i + 1) % count];

        const dx = next.px - prev.px;
        const dy = next.py - prev.py;

        const length = Math.hypot(dx, dy) || 1; // avoid division by zero
        const nx = -dy / length;
        const ny = dx / length;

        result.push({ px: prev.px, py: prev.py, nx, ny });
      }

      return result;
    }

    draw() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.ctx.beginPath();

      this.ctx.rect(0, 0, this.width, this.height);

      let newBorder = [];

      for (let i = 0; i < this.border.length; i++) {
        const point = this.border[i];
        let totalWave = 0;

        for (const wave of this.waves) {
          const dist = Math.abs(i - wave.index);
          const decay = Math.exp(-dist / wave.wavelength);
          const phase = wave.phase + this.tGlobal * 3;
          const pulse = Math.sin(
            (dist / wave.wavelength) * Math.PI * 2 + phase
          );
          const fade = 1 - wave.life / wave.duration;
          totalWave += pulse * decay * wave.amplitude * fade;
        }

        const targetX = point.x - point.nx * Math.abs(totalWave);
        const targetY = point.y - point.ny * Math.abs(totalWave);

        point.px = lerp(point.px, targetX, 0.1);
        point.py = lerp(point.py, targetY, 0.1);

        if (i === 0) this.ctx.moveTo(point.px, point.py);
        else this.ctx.lineTo(point.px, point.py);

        newBorder.push({ px: point.px, py: point.py });
      }
      this.ctx.closePath();

      this.ctx.lineWidth = 1;
      const gradient = this.lerpGradient(
        this.gradients[0],
        this.gradients[1],
        this.gradientTimer / this.gradientInterval
      );
      const ctxGradient = this.applyGradient(
        0,
        0,
        this.width,
        this.height,
        gradient.gradient
      );

      this.ctx.fillStyle = ctxGradient;
      this.ctx.fill("evenodd");

      this.ctx.strokeStyle = ctxGradient;
      this.ctx.shadowBlur = lerp(
        this.blurs[0],
        this.blurs[1],
        this.blurTimer / this.blurInterval
      );
      this.ctx.shadowColor = `rgba(${gradient.mainColor[0]}, ${gradient.mainColor[1]}, ${gradient.mainColor[2]}, ${gradient.mainColor[3]})`;
      this.ctx.stroke();
    }

    isLeftOrRightEdge(
      point: { x: number; y: number },
      height: number
    ): boolean {
      return point.y > this.radius && point.y < height - this.radius;
    }

    spawnWave() {
      const index = Math.floor(Math.random() * this.border.length);
      let wavelength = getRandomInt(this.waveLength.min, this.waveLength.max);
      let amplitude = getRandomInt(
        this.waveAmplitude.min,
        this.waveAmplitude.max
      );
      let duration = getRandomInt(this.waveDuration.min, this.waveDuration.max);

      if (!this.isLeftOrRightEdge(this.border[index], this.height)) {
        wavelength = getRandomInt(5, 10);
        amplitude = getRandomInt(5, 10);
      }

      this.waves.push({
        index,
        wavelength,
        amplitude,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        duration,
      });
    }

    animate(time: number) {
      const dt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.tGlobal += dt;

      this.waveSpawnTimer += dt;
      if (this.waveSpawnTimer >= this.waveSpawnInterval) {
        this.waveSpawnTimer = 0;
        for (let i = 0; i < 5; i++) this.spawnWave();
      }

      this.blurTimer += dt;
      if (this.blurTimer >= this.blurInterval) {
        this.blurTimer = 0;
        this.blurs = [this.blurs[1], getRandomInt(0, this.maxBlurSize)];
      }

      this.gradientTimer += dt;
      if (this.gradientTimer >= this.gradientInterval) {
        this.gradientTimer = 0;
        this.gradients = [this.gradients[1], this.generateGradient()];
      }

      for (const wave of this.waves) wave.life += dt;
      this.waves = this.waves.filter((wave) => wave.life < wave.duration);

      this.draw();
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  return (
    <canvas
      id="modalCanvas"
      className={`blur-[2px] ${props.className}`}
      style={props.style}
    ></canvas>
  );
}
