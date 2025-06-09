"use client";

import BorderWaves from "@/components/animations/borderWaves";
import { Slider } from "@/components/range/slider";
import { getRandomInt, lerp } from "@/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [intensivity, setIntensivity] = useState(0);
  const [waveAmplitude, setWaveAmplitude] = useState<{
    min: number;
    max: number;
  }>({ min: 10, max: 20 });
  const [gradientInterval, setGradientInterval] = useState(2);
  const [waveSpawnInterval, setWaveSpawnInterval] = useState(1);

  const maxSteps = 5;

  useEffect(() => {
    const waveAmplitudeMin = {
      min: 10,
      max: 20,
    };
    const waveAmplitudeMax = {
      min: 20,
      max: 40,
    };
    const waveSpawnIntervalMin = 0.5;
    const waveSpawnIntervalMax = 1;
    const gradientIntervalMin = 0.5;
    const gradientIntervalMax = 2;

    setWaveAmplitude({
      min: lerp(
        waveAmplitudeMin.min,
        waveAmplitudeMax.min,
        intensivity / maxSteps
      ),
      max: lerp(
        waveAmplitudeMin.max,
        waveAmplitudeMax.max,
        intensivity / maxSteps
      ),
    });
    setWaveSpawnInterval(
      lerp(waveSpawnIntervalMax, waveSpawnIntervalMin, intensivity / maxSteps)
    );
    setGradientInterval(
      lerp(gradientIntervalMax, gradientIntervalMin, intensivity / maxSteps)
    );
  }, [intensivity]);

  return (
    <div className="flex h-screen items-center justify-center gap-10 lg:p-10">
      <div className="relative flex items-center justify-center sm:w-[300px] sm:h-[610px] overflow-hidden rounded-[60px] pointer-events-none select-none">
        <Image src="/iphone.png" alt="Iphone" fill className="absolute" />

        <div className="relative flex items-center justify-center w-[295px] h-[600px] overflow-hidden rounded-[60px] [--webkit-mask-image:-webkit-radial-gradient(white,black)]">
          <BorderWaves
            className="absolute"
            width={270}
            height={585}
            radius={40}
            pointsPerMaxEdge={60}
            waveAmplitude={waveAmplitude}
            waveLength={{ min: 20, max: 30 }}
            waveSpawnInterval={waveSpawnInterval}
            gradientInterval={gradientInterval}
          />
        </div>

        <Image
          src="/iphone-borders.png"
          alt="Iphone"
          fill
          className="absolute"
        />
      </div>

      <div className="flex flex-col items-center gap-5 max-sm:absolute max-sm:mb-30">
        <Slider
          value={intensivity}
          onChange={setIntensivity}
          className="w-[100px]"
          max={maxSteps}
          icon={<Image src="/power.png" alt="power" height={15} width={15} />}
        />

        <Image
          src="/logo.png"
          alt="Logo"
          height={150}
          width={150}
          className="max-sm:hidden"
        />
      </div>
    </div>
  );
}
