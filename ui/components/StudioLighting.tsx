'use client';

import { Environment } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { DataTexture, EquirectangularReflectionMapping, FloatType, RGBAFormat } from 'three';

/** A continuous studio radiance field. Broad softboxes and a grey room replace hard white
 * rectangles in an otherwise black environment. Generated locally; no network HDR assets. */
function studioRadiance(quality: 'balanced' | 'high') {
  const width = quality === 'high' ? 2048 : 1024, height = width / 2;
  const data = new Float32Array(width * height * 4);
  const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const phi = (x / width - 0.5) * Math.PI * 2;
    // DataTexture has flipY=false: positive latitude is in the upper UV half.
    const elevation = (y / height - 0.5) * Math.PI;
    const panel = (azimuth: number, altitude: number, w: number, h: number) =>
      Math.exp(-Math.pow(wrap(phi - azimuth) / w, 2) - Math.pow((elevation - altitude) / h, 2));
    const key = 3.4 * panel(-0.55, 0.85, 0.65, 0.44);
    const fill = 0.70 * panel(2.25, 0.52, 1.0, 0.68);
    const strip = 1.9 * panel(1.1, 0.35, 0.12, 0.70);
    const rim = 1.05 * panel(-2.5, 0.6, 0.10, 0.5);
    const under = 0.22 * panel(0.8, -0.5, 0.8, 0.35);
    const ceiling = 0.10 * Math.max(0, Math.sin(elevation));
    const room = 0.16 + ceiling + 0.12 * Math.max(0, -Math.sin(elevation));
    const negativeFill = 1 - 0.50 * panel(-2.0, 0.16, 0.65, 0.85);
    const i = (y * width + x) * 4;
    data[i] = (room + key + fill * 0.88 + strip * 0.83 + rim * 0.91 + under) * negativeFill;
    data[i + 1] = (room + key * 0.98 + fill * 0.94 + strip * 0.93 + rim * 0.96 + under) * negativeFill;
    data[i + 2] = (room + key * 0.94 + fill + strip + rim + under * 1.07) * negativeFill;
    data[i + 3] = 1;
  }
  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

export default function StudioLighting({ detail = false, quality = 'high' }: { detail?: boolean; quality?: 'balanced' | 'high' }) {
  const environment = useMemo(() => studioRadiance(quality), [quality]);
  useEffect(() => () => environment.dispose(), [environment]);
  return <>
    <Environment map={environment} environmentIntensity={1} />
    <hemisphereLight args={['#e7edf4', '#9e9690', 0.22]} />
    <directionalLight position={[-3, 6, -1.5]} intensity={detail ? 0.5 : 0.75} color="#fffaf1"
      castShadow={!detail} shadow-mapSize={quality === 'high' ? [4096, 4096] : [2048, 2048]}
      shadow-camera-left={-2.1} shadow-camera-right={2.1}
      shadow-camera-top={2.1} shadow-camera-bottom={-2.1}
      shadow-camera-near={1} shadow-camera-far={14}
      shadow-bias={-0.00008} shadow-normalBias={0.0015} shadow-radius={6} />
  </>;
}
