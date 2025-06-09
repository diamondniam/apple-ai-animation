export type Wave = {
  index: number;
  wavelength: number;
  amplitude: number;
  phase: number;
  life: number;
  duration: number;
};

export type ColorStop = {
  offset: number; // 0 to 1
  color: [number, number, number, number]; // RGBA
};

export type GeneratedGradient = {
  gradient: GradientState;
  mainColor: [number, number, number, number];
};

export type GradientState = ColorStop[];

export type Props = {
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  lineWidth?: number;
  radius?: number;
  waveLength?: { min: number; max: number };
  waveAmplitude?: { min: number; max: number };
  waveDuration?: { min: number; max: number };
  pointsPerMaxEdge?: number;
  gradientInterval?: number;
  waveSpawnInterval?: number;
};
