'use client';

import { Edges, Line, RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { BoxGeometry, CanvasTexture, CatmullRomCurve3, ExtrudeGeometry, Path, Shape, SphereGeometry, SRGBColorSpace, TubeGeometry, Vector3, Vector2, LatheGeometry, TorusGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ANCHORS, BOARD, CHIP, DIE_SCALE, FRAME, GATE, GROUND, JUNCTION, PADS, PLATE, isDiePart } from '@/lib/chip-geometry';
import type { PartId } from '@/lib/parts';
import { DEFAULT_COMPONENT_MATERIALS, resolveMaterial, type MaterialProfile } from '@/lib/component-materials';
import { planContour, LEFT_ELECTRODE, RIGHT_ELECTRODE, SUBSTRATE_PLAN, TOP_GROUND_PLAN, GATE_PLAN } from '@/lib/chip-plan';

import { BOND_COUNT, BOND_FINISH, bondPosition, bondPoints, FILM_LAUNCHES, PERFORATIONS, JUNCTION_ELECTRODE, JUNCTION_OVERLAP } from '@/lib/chip-detail';

export const ACCENT = '#1a6fe0';

/** Illustrative appearance only. None of these values enter the calculation. */
const MAT = {
  gold: { color: '#e2b55b', metalness: 1, roughness: 0.34 },
  goldDeep: { color: '#b18136', metalness: 1, roughness: 0.38 },
  graphite: { color: '#959993', metalness: 0.96, roughness: 0.44 },
  laminate: { color: '#60272e', metalness: 0.04, roughness: 0.62, clearcoat: 0.18, clearcoatRoughness: 0.4 },
  chip: { color: '#141c2c', metalness: 0.28, roughness: 0.17, clearcoat: 0.65, clearcoatRoughness: 0.12, iridescence: 0.16, iridescenceIOR: 1.45, iridescenceThicknessRange: [180, 320] as [number, number] },
  ground: { color: '#667581', metalness: 0.98, roughness: 0.25 },
  silver: { color: '#b9c6d0', metalness: 1, roughness: 0.31 },
  screw: { color: '#d5b474', metalness: 1, roughness: 0.28 },
  black: { color: '#0e1114', metalness: 0.2, roughness: 0.8 },
} as const;

const PartColor = createContext<string | undefined>(undefined);
const PartMaterial = createContext<MaterialProfile | undefined>(undefined);
type MatKind = keyof typeof MAT;

// Brushed metal microfinish, not a decorative repeating pattern. All fine marks are
// deterministic and restrained so grazing reflections reveal machining without glitter.
type FinishVariant = 'machined' | 'brushed' | 'crystalline' | 'ceramic' | 'woven';
const finishes = new Map<FinishVariant, CanvasTexture>();
function surfaceFinish(kind: MatKind, finish: MaterialProfile['finish'] = 'brushed') {
  if (typeof document === 'undefined') return undefined;
  // Pool by actual pixel recipe, not part or selected element. Exploring the entire
  // catalog creates at most five finish maps instead of one 2K map per kind × finish.
  const variant: FinishVariant = finish === 'brushed'
    ? kind === 'gold' || kind === 'goldDeep' ? 'machined' : 'brushed'
    : finish === 'ceramic' ? kind === 'laminate' ? 'woven' : 'ceramic' : 'crystalline';
  const cached = finishes.get(variant); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
  const ctx = canvas.getContext('2d'); if (!ctx) return undefined;
  let seed = 37;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  if (variant === 'machined' || variant === 'brushed') {
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, 2048, 2048);
    for (let y = 0; y < 2048; y++) {
      const shade = Math.round(227 + 4 * Math.sin(y * 0.028) + 5 * Math.sin(y * 0.73));
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`; ctx.fillRect(0, y, 2048, 1);
    }
    // Fine tool travel modulates reflected light without changing material colour.
    for (let i = 0; i < 48000; i++) {
      const shade = 185 + random() * 70;
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.15 + random() * 0.3})`;
      ctx.lineWidth = 0.5 + random();
      const x = random() * 2048, y = random() * 2048;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8 + random() * 100, y + random() * 0.6); ctx.stroke();
    }
    if (variant === 'machined') {
      for (let row = -1; row < 11; row++) for (let col = -1; col < 11; col++) {
        for (let ring = 0; ring < 36; ring++) {
          ctx.strokeStyle = ring % 3 === 0 ? 'rgba(75,75,75,0.11)' : 'rgba(235,235,235,0.12)';
          ctx.lineWidth = 0.85; ctx.beginPath();
          ctx.arc(col * 220 + row * 27, row * 210, 40 + ring * 3.5, -2.7, 1.2); ctx.stroke();
        }
      }
    }
  } else {
    const ceramic = variant === 'ceramic' || variant === 'woven';
    // Polished metal and crystal share the same fine grain; their PBR values supply
    // their optical differences. Woven laminate retains a separate fibre texture.
    ctx.fillStyle = ceramic ? '#d9d9d9' : '#ededed'; ctx.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 52000; i++) {
      const value = Math.round(160 + random() * 90), x = random() * 2048, y = random() * 2048;
      ctx.fillStyle = `rgba(${value},${value},${value},${ceramic ? 0.34 : 0.1})`;
      ctx.fillRect(x, y, ceramic ? 2 : 1, 1);
    }
    if (variant === 'woven') for (let t = 0; t < 2048; t += 6) {
      ctx.strokeStyle = 'rgba(100,100,100,0.075)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, t); ctx.lineTo(2048, t); ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas); texture.anisotropy = 16;
  finishes.set(variant, texture); return texture;
}

function Material({ kind, selected, alphaMap, fixed = false, surface = 'front', attach }: {
  kind: MatKind; selected: boolean; alphaMap?: CanvasTexture | null; fixed?: boolean;
  surface?: 'front' | 'back' | 'edge'; attach?: string;
}) {
  const tint = useContext(PartColor);
  const assigned = useContext(PartMaterial);
  // Package is a plated housing with a separate Al shield. The default preserves that
  // construction; a custom package profile is deliberately visible on both large surfaces.
  const profile = fixed || kind === 'black' || (kind === 'graphite' && assigned?.id === 'Au') ? undefined : assigned;
  const finish = profile?.finish ?? (kind === 'chip' ? 'crystalline' : kind === 'laminate' ? 'ceramic' : 'brushed');
  const metalness = profile?.metalness ?? MAT[kind].metalness;
  const roughness = Math.min(0.92, (profile?.roughness ?? MAT[kind].roughness) + (kind === 'ground' ? 0.07 : kind === 'goldDeep' ? 0.06 : 0) + (surface === 'front' ? 0 : surface === 'back' ? 0.16 : 0.22));
  const textureKind = kind === 'laminate' && profile && profile.id !== 'laminate' ? 'chip' : kind;
  const brushed = finish === 'brushed' && metalness > 0.5;
  return <meshPhysicalMaterial attach={attach} {...MAT[kind]}
    color={fixed || kind === 'black' ? MAT[kind].color : (tint ?? profile?.color ?? MAT[kind].color)}
    metalness={metalness} roughness={roughness}
    clearcoat={profile?.clearcoat ?? (kind === 'chip' ? 0.65 : kind === 'laminate' ? 0.18 : 0)}
    clearcoatRoughness={profile?.clearcoatRoughness ?? 0.16}
    transmission={profile?.transmission ?? 0} thickness={profile?.transmission ? 0.06 : 0}
    ior={profile?.ior ?? 1.5} iridescence={profile?.iridescence ?? (kind === 'chip' ? 0.16 : 0)}
    iridescenceIOR={1.45} iridescenceThicknessRange={[120, 260]}
    envMapIntensity={surface === 'front' ? 1.05 : 0.88} specularIntensity={1}
    alphaMap={alphaMap} alphaTest={alphaMap ? 0.5 : 0}
    bumpMap={surfaceFinish(textureKind, finish)} roughnessMap={surfaceFinish(textureKind, finish)}
    bumpScale={surface === 'edge' ? 0.00015 : brushed ? 0.00004 : finish === 'ceramic' ? 0.000045 : 0.000012}
    anisotropy={brushed ? 0.48 : 0} anisotropyRotation={surface === 'back' ? Math.PI / 2 : 0}
    emissive={selected ? ACCENT : '#000000'} emissiveIntensity={selected ? 0.035 : 0} />;
}

function roundedRect(size: number, r: number): Shape {
  const h = size / 2;
  const s = new Shape();
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}

/** Keep cap lithography aligned while giving cut walls non-degenerate machining UVs. */
function extrusionUVs(geometry: ExtrudeGeometry, width: number, height: number, depth: number, bottom: number) {
  const uv = geometry.getAttribute('uv'), pos = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
  for (let i = 0; i < uv.count; i++) {
    if (Math.abs(normal.getZ(i)) >= 0.85) {
      uv.setXY(i, pos.getX(i) / width + 0.5, pos.getY(i) / height + 0.5);
    } else {
      const alongWall = Math.abs(normal.getX(i)) > Math.abs(normal.getY(i)) ? pos.getY(i) / height : pos.getX(i) / width;
      uv.setXY(i, alongWall + 0.5, (pos.getZ(i) - bottom) / depth);
    }
  }
}

function ringGeometry(outer: number, inner: number, depth: number, bevel: number, radius: number): ExtrudeGeometry {
  const shape = roundedRect(outer - 2 * bevel, radius);
  const hole = roundedRect(inner + 2 * bevel, radius * 0.5);
  shape.holes.push(hole as unknown as Path);
  const geometry = new ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  });
  extrusionUVs(geometry, outer, outer, depth, -bevel);
  return geometry;
}

/** Extruded shape laid flat: local +z becomes world +y, `top` is the y of the upper bevel face. */
function Slab({
  geometry,
  top,
  depth,
  bevel,
  kind,
  selected,
}: {
  geometry: ExtrudeGeometry;
  top: number;
  depth: number;
  bevel: number;
  kind: MatKind;
  selected: boolean;
}) {
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position-y={top - depth + bevel} castShadow receiveShadow>
      <Material kind={kind} selected={selected} />
      {selected && <Edges color={ACCENT} threshold={30} lineWidth={1.2} />}
    </mesh>
  );
}

interface Bore { x: number; z: number; r: number }
function bore(x: number, z: number, r: number): Path {
  const hole = new Path(); hole.absarc(x, -z, r, 0, Math.PI * 2, true); return hole;
}
function roundedPanel(w: number, h: number, r: number): Shape {
  const x = w / 2, y = h / 2, shape = new Shape();
  shape.moveTo(-x + r, -y); shape.lineTo(x - r, -y);
  shape.quadraticCurveTo(x, -y, x, -y + r); shape.lineTo(x, y - r);
  shape.quadraticCurveTo(x, y, x - r, y); shape.lineTo(-x + r, y);
  shape.quadraticCurveTo(-x, y, -x, y - r); shape.lineTo(-x, -y + r);
  shape.quadraticCurveTo(-x, -y, -x + r, -y); return shape;
}
function metalExtrusion(shape: Shape, depth: number, bevel: number, w: number, h: number) {
  const geometry = new ExtrudeGeometry(shape, {depth: depth - 2 * bevel, bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 40});
  extrusionUVs(geometry, w, h, depth, -bevel);
  return geometry;
}

/** A real recessed hex socket, bevelled head and turned countersink. */
function Screw({ position, r = 0.056 }: { position: [number, number, number]; r?: number }) {
  const head = useMemo(() => {
    const shape = new Shape(); shape.absarc(0, 0, r * 0.78, 0, Math.PI * 2, false);
    const socket = new Path();
    for (let i = 0; i < 6; i++) {
      const a = -i * Math.PI / 3, x = Math.cos(a) * r * 0.34, y = Math.sin(a) * r * 0.34;
      if (i === 0) socket.moveTo(x, y); else socket.lineTo(x, y);
    }
    socket.closePath(); shape.holes.push(socket);
    return metalExtrusion(shape, 0.012, 0.0015, r * 2, r * 2);
  }, [r]);
  const seat = useMemo(() => new LatheGeometry([
    new Vector2(r * 1.12, -0.002), new Vector2(r * 1.12, 0.001),
    new Vector2(r, 0.005), new Vector2(r * 0.83, 0.001),
    new Vector2(r * 0.80, -0.009), new Vector2(r * 0.78, -0.013),
  ], 48), [r]);
  return <group position={position}>
    <mesh geometry={seat} receiveShadow><meshPhysicalMaterial {...MAT.screw} /></mesh>
    <mesh position-y={-0.011} rotation-x={-Math.PI / 2} geometry={head} castShadow receiveShadow>
      <Material kind="gold" selected={false} fixed />
    </mesh>
    <mesh position-y={-0.014}><cylinderGeometry args={[r * 0.78, r * 0.78, 0.004, 32]} />
      <meshStandardMaterial color="#100c06" roughness={0.65} metalness={0.55} /></mesh>
  </group>;
}

function ThreadedPort({ position, r = 0.035 }: { position: [number, number, number]; r?: number }) {
  const geometry = useMemo(() => new LatheGeometry([
    new Vector2(r * 1.25, 0), new Vector2(r * 1.06, 0.004), new Vector2(r * 0.84, -0.003),
    new Vector2(r * 0.80, -0.029), new Vector2(r * 0.93, -0.032), new Vector2(r * 1.18, -0.002),
  ], 40), [r]);
  return <group position={position}>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial {...MAT.screw} /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position-y={-0.008 - i * 0.006} rotation-x={-Math.PI / 2}>
      <torusGeometry args={[r * 0.8, 0.0013, 5, 32]} /><meshPhysicalMaterial {...MAT.goldDeep} />
    </mesh>)}
    <mesh position-y={-0.033}><cylinderGeometry args={[r * 0.81, r * 0.81, 0.002, 32]} />
      <meshStandardMaterial color="#080705" roughness={0.75} /></mesh>
  </group>;
}

function RailMark({ sign }: { sign: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 96;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.clearRect(0, 0, 1024, 96); ctx.fillStyle = '#3f3b32'; ctx.font = '32px monospace';
    ctx.textAlign = 'center'; ctx.fillText(sign > 0 ? 'QUBIT STUDIO   /   QS–01' : 'TRANSMON   •   REV A', 512, 60);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 8; return map;
  }, [sign]);
  return <mesh position-y={0.001} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[1.12, 0.105]} /><meshStandardMaterial color="#686051" map={texture ?? undefined}
      transparent depthWrite={false} roughness={0.85} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

/** Lithographic fan-outs and perimeter bond pads. Decorative, not solver geometry. */
function useGroundTexture(): CanvasTexture | null {
  return useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 2048, 2048);
    ctx.translate(1024, 1024); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff';
    ctx.beginPath();
    planContour(SUBSTRATE_PLAN).forEach(([x,z],i) => {
      if (i === 0) ctx.moveTo(x / CHIP.size * 2048, z / CHIP.size * 2048);
      else ctx.lineTo(x / CHIP.size * 2048, z / CHIP.size * 2048);
    });
    ctx.closePath(); ctx.clip();
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      for (const launch of FILM_LAUNCHES) {
        ctx.fillRect(launch.x - 4.5, 936, 9, 38);
        ctx.fillRect(launch.x - 3, 904, 6, 14);
        ctx.lineWidth = launch.width;
        ctx.beginPath();
        launch.points.forEach(([x,y], i) => i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
        ctx.stroke();
      }
      ctx.lineWidth = 2; ctx.strokeRect(-895, 890, 1790, 101);
      ctx.restore();
    }
    // Discrete structures in the open corners, with registration crosses.
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      ctx.lineWidth = 2; ctx.strokeRect(x * 795 - 17, y * 795 - 17, 34, 34);
      ctx.beginPath(); ctx.moveTo(x * 690 - 13,y * 690); ctx.lineTo(x * 690 + 13,y * 690);
      ctx.moveTo(x * 690,y * 690 - 13); ctx.lineTo(x * 690,y * 690 + 13); ctx.stroke();
    }
    const texture = new CanvasTexture(canvas); texture.anisotropy = 16; return texture;
  }, []);
}

export interface PartProps {
  id: PartId;
  selected: boolean;
  hidden: boolean;
  /** Smoothed 0..1 separation. */
  explode: number;
  onSelect?: (id: PartId) => void;
  /** Explode guides are drawn only in the main scene. */
  guides?: boolean;
  color?: string;
  /** Physically distinct finish for this component; fixed attachments retain their materials. */
  material?: MaterialProfile;
}

function PartGroup({
  id,
  explodeY,
  explode,
  hidden,
  onSelect,
  guides,
  children,
}: {
  id: PartId;
  explodeY: number;
  explode: number;
  hidden: boolean;
  onSelect?: (id: PartId) => void;
  guides?: boolean;
  children: React.ReactNode;
}) {
  if (hidden) return null;
  const anchor = ANCHORS[id].point;
  const y = explodeY * explode;
  return (
    <>
      <group
        position-y={y}
        scale={isDiePart(id) ? [DIE_SCALE, 1, DIE_SCALE] : [1, 1, 1]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          if (!onSelect || event.delta > 4) return;
          event.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(event) => {
          if (!onSelect) return;
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (onSelect) document.body.style.cursor = '';
        }}
      >
        {children}
      </group>
      {guides && Math.abs(y) > 0.002 && (
        <Line
          points={[
            [anchor[0], anchor[1], anchor[2]],
            [anchor[0], anchor[1] + y, anchor[2]],
          ]}
          color="#7c8792"
          lineWidth={1}
          dashed
          dashSize={0.02}
          gapSize={0.02}
        />
      )}
    </>
  );
}

const BEVEL = 0.014;
const FRAME_BORES: Bore[] = [
  ...[-1, 1].flatMap(x => [-1, 1].map(z => ({x: x * 1.095, z: z * 1.095, r: 0.082}))),
  ...[-1, 1].flatMap(side => [-0.52, 0.52].flatMap(t => [
    {x: t, z: side * 1.169, r: 0.046}, {x: side * 1.169, z: t, r: 0.046},
  ])),
];

export function Package({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const frame = useMemo(() => {
    const shape = roundedRect(FRAME.outer - 2 * BEVEL, 0.18);
    shape.holes.push(roundedRect(FRAME.inner + 2 * BEVEL, 0.23));
    FRAME_BORES.forEach(p => shape.holes.push(bore(p.x, p.z, p.r + BEVEL)));
    return metalExtrusion(shape, 0.14, BEVEL, FRAME.outer, FRAME.outer);
  }, []);
  const seam = useMemo(() => ringGeometry(2.458, 2.13, 0.010, 0.002, 0.18), []);
  const lowerRim = useMemo(() => ringGeometry(2.49, 2.13, 0.072, 0.008, 0.18), []);
  // Narrow turned edge bands reveal the package's thickness at grazing angles.
  const edgeBand = useMemo(() => ringGeometry(2.492, 2.465, 0.004, 0.0008, 0.18), []);
  const innerStep = useMemo(() => ringGeometry(2.18, 2.095, 0.02, 0.004, 0.22), []);
  const plate = useMemo(() => {
    const shape = roundedRect(PLATE.size - 0.014, 0.045);
    shape.holes.push(roundedRect(PLATE.window + 0.014, 0.05));
    // Auxiliary milled pockets: recess walls are geometry, their floors are below the lid.
    const pocket = roundedPanel(0.20, 0.31, 0.035);
    const path = new Path(pocket.getPoints().map(p => p.add(new Vector2(0.755, 0.27))));
    shape.holes.push(path);
    const small = roundedPanel(0.12, 0.20, 0.024);
    shape.holes.push(new Path(small.getPoints().map(p => p.add(new Vector2(-0.77, -0.26)))));
    for (const x of [-0.84, 0.84]) for (const z of [-0.66, 0.66]) shape.holes.push(bore(x, z, 0.030));
    return metalExtrusion(shape, PLATE.depth, 0.007, PLATE.size, PLATE.size);
  }, []);
  const lip = useMemo(() => ringGeometry(PLATE.window + 0.085, PLATE.window - 0.035, 0.027, 0.003, 0.05), []);
  const rail = useMemo(() => {
    const shape = roundedPanel(1.78, 0.225, 0.06);
    for (const x of [-0.70, 0.70]) shape.holes.push(bore(x, 0, 0.076));
    return metalExtrusion(shape, 0.042, 0.006, 1.78, 0.225);
  }, []);
  const railY = PLATE.top + 0.049;
  const railOffset = PLATE.size / 2 - 0.12;
  return <>
    <PartGroup id="package" explodeY={FRAME.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
      <Slab geometry={frame} top={FRAME.top} depth={0.14} bevel={BEVEL} kind="gold" selected={selected} />
      <Slab geometry={seam} top={FRAME.top - 0.14} depth={0.010} bevel={0.002} kind="black" selected={false} />
      <Slab geometry={lowerRim} top={FRAME.top - 0.148} depth={0.072} bevel={0.008} kind="goldDeep" selected={selected} />
      {[0.165, 0.185, 0.205].map(offset => <Slab key={offset} geometry={edgeBand} top={FRAME.top - offset} depth={0.004} bevel={0.0008} kind="gold" selected={selected} />)}
      <Slab geometry={innerStep} top={FRAME.top - 0.028} depth={0.02} bevel={0.004} kind="goldDeep" selected={selected} />
      {FRAME_BORES.map((p, i) => i < 4
        ? <Screw key={i} position={[p.x, FRAME.top - 0.002, p.z]} r={0.074} />
        : <ThreadedPort key={i} position={[p.x, FRAME.top - 0.001, p.z]} r={0.042} />)}
    </PartGroup>
    <PartGroup id="package" explodeY={PLATE.explodeY} explode={explode} hidden={hidden} onSelect={onSelect}>
      <Slab geometry={lip} top={PLATE.top - 0.016} depth={0.027} bevel={0.003} kind="goldDeep" selected={false} />
      <LidDetails />
      <PackageInserts />
      <Slab geometry={plate} top={PLATE.top} depth={PLATE.depth} bevel={0.007} kind="graphite" selected={selected} />
      {[-1, 1].map(sign => <group key={sign} position={[0, railY, sign * railOffset]}>
        <RoundedBox args={[1.72, 0.018, 0.198]} position-y={-0.053} radius={0.012} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#4d493e" metalness={0.8} roughness={0.48} />
        </RoundedBox>
        <Slab geometry={rail} top={0} depth={0.042} bevel={0.006} kind="gold" selected={selected} />
        {[-0.70, 0.70].map(x => <Screw key={x} position={[x, -0.001, 0]} r={0.061} />)}
        <RailMark sign={sign} />
      </group>)}
      {[-0.84, 0.84].flatMap(x => [-0.66, 0.66].map(z => <ThreadedPort key={`${x},${z}`} position={[x, PLATE.top, z]} r={0.020} />))}
      {/* Dark ceramic inserts below the machined top edges, with asymmetric contact pads. */}
      {[[0.755, -0.27, 0.19, 0.30], [-0.77, 0.26, 0.115, 0.195]].map(([x, z, w, d]) => <group key={x} position={[x, PLATE.top - 0.027, z]}>
        <RoundedBox args={[w, 0.018, d]} radius={0.016} smoothness={4} receiveShadow><meshPhysicalMaterial {...MAT.black} /></RoundedBox>
        <RoundedBox args={[w * 0.54, 0.008, d * 0.42]} position-y={0.012} radius={0.004} smoothness={3}>
          <meshPhysicalMaterial color="#67717a" metalness={0.9} roughness={0.33} />
        </RoundedBox>
        {[-1, 1].map(sign => <mesh key={sign} position={[0, 0.012, sign * d * 0.37]}>
          <boxGeometry args={[w * 0.32, 0.006, 0.016]} /><meshPhysicalMaterial {...MAT.goldDeep} />
        </mesh>)}
      </group>)}
    </PartGroup>
  </>;
}

/** Reference-inspired packaging detail only; not additional simulated devices or wiring. */
function PackageInserts() {
  const detail = useMemo(() => {
    const traces = [], terminals = [], bodies = [], rings = [];
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const x = 0.666 + i * 0.017;
        for (const end of [-1, 1]) {
          const body = new BoxGeometry(0.009, 0.012, 0.025);
          body.translate(x, PLATE.top + 0.011, 0.29 + end * 0.213);
          if (sign < 0) body.rotateY(Math.PI);
          bodies.push(body);
          for (const tip of [-1, 1]) {
            const terminal = new BoxGeometry(0.010, 0.013, 0.007);
            terminal.translate(x, PLATE.top + 0.011, 0.29 + end * 0.213 + tip * 0.012);
            if (sign < 0) terminal.rotateY(Math.PI);
            terminals.push(terminal);
          }
        }
        // Parallel rounded fan-out stays in the shield's side corridor, clear of the chip.
        const curve = new CatmullRomCurve3([
          new Vector3(x, PLATE.top + 0.0018, 0.29 - 0.225),
          new Vector3(x, PLATE.top + 0.0018, 0.035 - i * 0.008),
          new Vector3(x - 0.014, PLATE.top + 0.0018, 0.016 - i * 0.008),
          new Vector3(PLATE.window / 2 + 0.070, PLATE.top + 0.0018, 0.016 - i * 0.008),
        ]);
        const trace = new TubeGeometry(curve, 20, 0.0013, 5, false);
        if (sign < 0) trace.rotateY(Math.PI);
        traces.push(trace);
        for (const end of [-1, 1]) {
          const finger = new BoxGeometry(0.009, 0.003, 0.045);
          finger.translate(x, PLATE.top + 0.019, 0.29 + end * 0.156);
          if (sign < 0) finger.rotateY(Math.PI);
          terminals.push(finger);
        }
      }
      for (const z of [0.185, 0.395]) for (const x of [0.683, 0.837]) {
        const ring = new TorusGeometry(0.008, 0.0017, 6, 16);
        ring.rotateX(-Math.PI / 2); ring.translate(x, PLATE.top + 0.028, z);
        if (sign < 0) ring.rotateY(Math.PI);
        rings.push(ring);
      }
    }
    const result = { traces: mergeGeometries(traces), terminals: mergeGeometries(terminals), bodies: mergeGeometries(bodies), rings: mergeGeometries(rings) };
    [...traces, ...terminals, ...bodies, ...rings].forEach(g => g.dispose());
    return result;
  }, []);
  return <>
    {[-1, 1].map(sign => <group key={sign} rotation-y={sign < 0 ? Math.PI : 0}>
      <group position={[0.76, PLATE.top, 0.29]}>
        <RoundedBox args={[0.238, 0.008, 0.354]} position-y={0.004} radius={0.003} smoothness={3} receiveShadow>
          <meshPhysicalMaterial color="#363d3b" metalness={0.3} roughness={0.65} />
        </RoundedBox>
        <RoundedBox args={[0.224, 0.010, 0.338]} position-y={0.012} radius={0.004} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#d8ceb1" metalness={0.22} roughness={0.62} />
        </RoundedBox>
        <RoundedBox args={[0.184, 0.010, 0.248]} position-y={0.022} radius={0.004} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color={sign > 0 ? '#285e62' : '#474f53'} metalness={0.18} roughness={0.58} />
        </RoundedBox>
        <RoundedBox args={[0.122, 0.012, sign > 0 ? 0.164 : 0.132]} position-y={0.033} radius={0.003} smoothness={3} castShadow receiveShadow>
          <Material kind={sign > 0 ? 'goldDeep' : 'silver'} selected={false} fixed />
        </RoundedBox>
      </group>
    </group>)}
    <mesh geometry={detail.traces} receiveShadow><meshPhysicalMaterial color="#c2ad7d" metalness={0.85} roughness={0.52} /></mesh>
    <mesh geometry={detail.bodies} castShadow><meshPhysicalMaterial color="#303736" roughness={0.68} /></mesh>
    <mesh geometry={detail.terminals} receiveShadow><meshPhysicalMaterial color="#c4c7bc" metalness={0.9} roughness={0.46} /></mesh>
    <mesh geometry={detail.rings}><meshPhysicalMaterial {...MAT.goldDeep} /></mesh>
  </>;
}

function LidDetails() {
  const lands = useMemo(() => {
    const pieces = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < BOND_COUNT; i++) {
      const pad = new BoxGeometry(0.009, 0.002, 0.043);
      pad.translate(bondPosition(i) * 1.05 * DIE_SCALE, PLATE.top + 0.001, PLATE.window / 2 + 0.040);
      pad.rotateY(side * Math.PI / 2); pieces.push(pad);
    }
    const geometry = mergeGeometries(pieces); pieces.forEach(g => g.dispose()); return geometry;
  }, []);
  const engraving = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.clearRect(0,0,2048,2048); ctx.strokeStyle = '#454943'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.roundRect(342,342,1364,1364,65); ctx.stroke();
    ctx.strokeStyle = '#b8b6ac'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(345,345,1358,1358,63); ctx.stroke();
    ctx.fillStyle = '#42443d'; ctx.font = '15px monospace';
    ctx.save(); ctx.translate(230,1090); ctx.rotate(-Math.PI/2); ctx.fillText('SHIELD 01   /   QS–01',0,0); ctx.restore();
    ctx.save(); ctx.translate(1805,770); ctx.rotate(Math.PI/2); ctx.fillText('CRYOGENIC PACKAGE   •   ILLUSTRATIVE',0,0); ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#3d4543';
    ctx.font = '32px sans-serif'; ctx.fillText('QUBIT STUDIO', 1024, 1770);
    ctx.font = '17px monospace'; ctx.fillText('QS–01   /   TRANSMON', 1024, 1804);
    ctx.restore();
    for (const x of [275,1773]) for (const y of [440,1608]) {
      ctx.fillRect(x-9,y,18,1.5); ctx.fillRect(x,y-9,1.5,18);
    }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 16; return map;
  }, []);
  return <>
    <mesh geometry={lands}><meshPhysicalMaterial color={BOND_FINISH.land} roughness={0.3} metalness={1}/></mesh>
    {/* Lettering spans the lid's aperture. Its transparent pixels must not intercept die picks. */}
    <mesh position-y={PLATE.top + 0.0003} rotation-x={-Math.PI/2} raycast={() => null}>
      <planeGeometry args={[PLATE.size,PLATE.size]}/><meshStandardMaterial map={engraving} transparent depthWrite={false} roughness={0.65} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>
  </>;
}

export function Board({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const pads = useMemo(() => {
    const pieces = [];
    const ring = BOARD.size / 2 - 0.075;
    for (let side = 0; side < 4; side++) for (let i = 0; i < 44; i++) {
      const pad = new BoxGeometry(0.08, 0.004, 0.010);
      pad.translate(ring, BOARD.top + 0.003, -0.76 + i * 1.52 / 43);
      pad.rotateY(side * Math.PI / 2); pieces.push(pad);
    }
    const geometry = mergeGeometries(pieces); pieces.forEach(p => p.dispose()); return geometry;
  }, []);
  return (
    <PartGroup id="board" explodeY={BOARD.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
      <RoundedBox args={[BOARD.size, BOARD.thickness, BOARD.size]} position-y={BOARD.top - BOARD.thickness / 2}
        radius={0.006} smoothness={4} castShadow receiveShadow>
        <Material kind="laminate" selected={selected} />
        {selected && <Edges color={ACCENT} lineWidth={1.2} />}
      </RoundedBox>
      <BoardEdges />
      <BoardBackside />
      <RoundedBox args={[0.89, 0.001, 0.89]} position-y={BOARD.top + 0.0002} radius={0.0004} smoothness={3} receiveShadow>
        <Material kind="goldDeep" selected={false} fixed />
      </RoundedBox>
      <BoardContacts />
      <mesh geometry={pads} receiveShadow><meshPhysicalMaterial {...MAT.goldDeep} /></mesh>
      <BoardHardware />
      <BoardArtwork />

    </PartGroup>
  );
}

function BoardArtwork() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.clearRect(0, 0, 2048, 2048); ctx.translate(1024, 1024);
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      for (let i = 0; i < 72; i++) {
        const x = -850 + i * 1700 / 71, inner = x * 0.57;
        ctx.strokeStyle = i % 5 === 0 ? 'rgba(182,139,91,0.65)' : 'rgba(167,125,91,0.32)'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.moveTo(x, 972); ctx.lineTo(x, 805 - Math.abs(x) * 0.16);
        ctx.lineTo(inner, 530); ctx.lineTo(inner, 450); ctx.stroke();
        ctx.fillStyle = '#b39c60'; ctx.fillRect(x - 3, 935, 6, 20);
        for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(x, 890 - j * 21, 3, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = '#acb8ad'; ctx.font = '15px monospace'; ctx.fillText('QS-01   •   RF / DC    REV A', -190, 967);
      for (const x of [-810, 810]) { ctx.lineWidth = 2; ctx.strokeStyle = '#93a89c';
        ctx.strokeRect(x - 22, 810, 44, 55); ctx.fillText('+',x - 5, 887); }
      ctx.restore();
    }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 16; return map;
  }, []);
  const components = useMemo(() => {
    const bodies = [], terminals = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < 24; i++) {
      const t = -0.80 + i * 1.60 / 23;
      const body = new BoxGeometry(0.026, 0.016, 0.012);
      body.translate(1.009, BOARD.top + 0.013, t); body.rotateY(side * Math.PI / 2); bodies.push(body);
      for (const end of [-1,1]) { const terminal = new BoxGeometry(0.007,0.018,0.014);
        terminal.translate(1.009 + end * 0.013, BOARD.top + 0.013, t);
        terminal.rotateY(side * Math.PI / 2); terminals.push(terminal); }
    }
    const body = mergeGeometries(bodies), terminal = mergeGeometries(terminals);
    [...bodies,...terminals].forEach(g => g.dispose()); return {body,terminal};
  }, []);
  return <>
    <mesh position-y={BOARD.top + 0.0006} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[BOARD.size,BOARD.size]} /><meshPhysicalMaterial map={texture} transparent depthWrite={false} roughness={0.43} metalness={0.48} />
    </mesh>
    <mesh geometry={components.body} castShadow><meshPhysicalMaterial color="#292c29" roughness={0.6} /></mesh>
    <mesh geometry={components.terminal}><meshPhysicalMaterial color="#aab0b2" metalness={0.95} roughness={0.25} /></mesh>
  </>;
}

/** The carrier is visible as a complete object when exploded: routed underside and cut laminate. */
function BoardEdges() {
  const profile = useContext(PartMaterial);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 128;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.clearRect(0, 0, 2048, 128);
    for (let row = 8; row < 128; row += 15) {
      ctx.fillStyle = 'rgba(204,166,118,0.40)'; ctx.fillRect(0, row, 2048, 2);
      ctx.fillStyle = 'rgba(45,22,24,0.5)'; ctx.fillRect(0, row + 3, 2048, 3);
      for (let col = 0; col < 2048; col += 9) {
        ctx.fillStyle = 'rgba(223,192,155,0.28)'; ctx.fillRect(col, row + 8, 5, 2);
      }
    }
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 16; return map;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (profile?.id !== 'laminate') return null;
  return <>{[0, 1, 2, 3].map(side => <group key={side} rotation-y={side * Math.PI / 2}>
    <mesh position={[0, BOARD.top - BOARD.thickness / 2, BOARD.size / 2 + 0.00015]} receiveShadow>
      <planeGeometry args={[BOARD.size - 0.016, BOARD.thickness - 0.012]} />
      <meshPhysicalMaterial map={texture} transparent depthWrite={false} roughness={0.82} />
    </mesh>
  </group>)}</>;
}

function BoardBackside() {
  const artwork = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.clearRect(0, 0, 2048, 2048); ctx.translate(1024, 1024);
    // Via stitching follows a perimeter ground return; launch traces clear the central die seat.
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      for (let i = 0; i < 50; i++) {
        const x = -850 + i * 1700 / 49;
        ctx.strokeStyle = 'rgba(201,157,97,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 982); ctx.lineTo(x, 820 - Math.abs(x) * 0.1);
        ctx.lineTo(x * 0.52, 540); ctx.lineTo(x * 0.52, 480); ctx.stroke();
        ctx.fillStyle = '#ae9868'; ctx.beginPath(); ctx.arc(x, 904, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#261f1c'; ctx.beginPath(); ctx.arc(x, 904, 1.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#bba97e'; ctx.lineWidth = 2; ctx.strokeRect(-925, 932, 1850, 50);
      ctx.restore();
    }
    ctx.strokeStyle = '#baae90'; ctx.lineWidth = 1.8;
    ctx.strokeRect(-457, -457, 914, 914); ctx.strokeRect(-446, -446, 892, 892);
    ctx.fillStyle = '#ccc1a0'; ctx.font = '24px monospace'; ctx.textAlign = 'center';
    ctx.fillText('CARRIER   /   BACK', 0, 570); ctx.font = '16px monospace'; ctx.fillText('QS–01   ·   RF / DC', 0, 600);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; map.anisotropy = 16; return map;
  }, []);
  useEffect(() => () => artwork?.dispose(), [artwork]);
  return <>
    <mesh rotation-x={Math.PI / 2} position-y={BOARD.top - BOARD.thickness - 0.0003} receiveShadow>
      <planeGeometry args={[BOARD.size - 0.012, BOARD.size - 0.012]} />
      <meshPhysicalMaterial map={artwork} transparent depthWrite={false} metalness={0.5} roughness={0.46} />
    </mesh>
    <RoundedBox args={[0.78, 0.002, 0.78]} position-y={BOARD.top - BOARD.thickness - 0.0008} radius={0.0008} smoothness={3} receiveShadow>
      <Material kind="goldDeep" selected={false} fixed surface="back" />
    </RoundedBox>
  </>;
}

function BoardHardware() {
  const vias = useMemo(() => {
    const rings = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < 26; i++) {
      const ring = new TorusGeometry(0.008, 0.002, 5, 12);
      ring.rotateX(-Math.PI / 2); ring.translate(1.045, BOARD.top + 0.003, -0.74 + i * 1.48 / 25);
      ring.rotateY(side * Math.PI / 2); rings.push(ring);
    }
    const geometry = mergeGeometries(rings); rings.forEach(g => g.dispose()); return geometry;
  }, []);
  return <>
    <mesh geometry={vias}><meshPhysicalMaterial {...MAT.gold} /></mesh>
    {[-1, 1].flatMap(x => [-1, 1].map(z => <group key={`${x},${z}`} position={[x * 0.974, BOARD.top + 0.013, z * 0.974]}>
      <ThreadedPort position={[0, 0, 0]} r={0.025} />
      <mesh rotation-x={-Math.PI / 2} position={[x * -0.025, -0.009, z * -0.050]}>
        <planeGeometry args={[0.056, 0.002]} /><meshBasicMaterial color="#9baeb6" />
      </mesh>
    </group>))}
  </>;
}

function planGeometry(path:string,depth:number,mirror=false,bevel=0) {
  const shape=new Shape();
  planContour(path).forEach(([x,z],i)=>{const y=mirror?z:-z;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);});
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3});
  // The caps share die-space UVs; sidewalls use their own depth axis.
  extrusionUVs(geometry, CHIP.size, CHIP.size, depth + 2 * bevel, -bevel);
  return geometry;
}

export function Substrate({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const geometry = useMemo(() => planGeometry(SUBSTRATE_PLAN, CHIP.thickness, false, 0.0012), []);
  const backside = useMemo(() => planGeometry(SUBSTRATE_PLAN, 0.0003, true, 0), []);
  const edgeTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 128;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = '#ddd'; ctx.fillRect(0, 0, 2048, 128);
    // Dicing leaves transverse saw marks; the polished wafer face remains smooth.
    for (let x = 0; x < 2048; x += 2) {
      const gray = Math.round(125 + 65 * Math.abs(Math.sin(x * 1.31)));
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`; ctx.fillRect(x, 0, 1, 128);
    }
    const map = new CanvasTexture(canvas); map.anisotropy = 16; return map;
  }, []);
  const profile = useContext(PartMaterial);
  const tint = useContext(PartColor);
  const edges = useMemo(() => {
    const contour = planContour(SUBSTRATE_PLAN);
    return contour.map(([x, z], i) => {
      const next = contour[(i + 1) % contour.length], dx = next[0] - x, dz = next[1] - z;
      const length = Math.hypot(dx, dz);
      return { length, rotation: Math.atan2(dz, -dx), x: (x + next[0]) / 2 + dz / length * 0.00123,
        z: (z + next[1]) / 2 - dx / length * 0.00123 };
    });
  }, []);
  useEffect(() => () => edgeTexture?.dispose(), [edgeTexture]);
  return (
    <PartGroup id="substrate" explodeY={CHIP.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} castShadow receiveShadow position-y={-CHIP.thickness}>
        <Material kind="chip" selected={selected} attach="material-0" />
        <Material kind="chip" selected={selected} surface="edge" attach="material-1" />
        {selected && <Edges color={ACCENT} lineWidth={1.2} />}
      </mesh>
      <mesh geometry={backside} rotation-x={Math.PI / 2} position-y={-CHIP.thickness - 0.00125} receiveShadow>
        <Material kind="chip" selected={selected} surface="back" />
      </mesh>
      {edges.map((edge, i) => <group key={i}>
        <mesh position={[edge.x, -CHIP.thickness / 2, edge.z]} rotation-y={edge.rotation} receiveShadow>
          <planeGeometry args={[edge.length - 0.004, CHIP.thickness - 0.006]} />
          <meshPhysicalMaterial color={tint ?? profile?.color ?? MAT.chip.color} roughness={0.58}
            metalness={profile?.metalness ?? 0.3} bumpMap={edgeTexture} bumpScale={0.00028}
            roughnessMap={edgeTexture} clearcoat={0.05} />
        </mesh>
      </group>)}
    </PartGroup>
  );
}

function BondWires() {
  const geometry = useMemo(() => {
    const wires = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < BOND_COUNT; i++) {
      const curve = new CatmullRomCurve3(bondPoints(i, side).map(p => new Vector3(...p)));
      const wire = new TubeGeometry(curve, 26, 0.00115, 8, false);
      wire.rotateY(side * Math.PI / 2); wires.push(wire);
    }
    const merged = mergeGeometries(wires); wires.forEach(g => g.dispose()); return merged;
  }, []);
  const feet = useMemo(() => {
    const pieces = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < BOND_COUNT; i++) {
      const t = bondPosition(i);
      // Flattened bonds are illustrative attachment detail, not electrical geometry.
      for (const [x, y, z] of [
        [t, 0.005, CHIP.size / 2 - 0.022],
        [t * 1.05, PLATE.top + 0.003, (PLATE.window / 2 + 0.028) / DIE_SCALE],
      ]) {
        const foot = new SphereGeometry(1, 8, 6);
        foot.scale(0.0032, 0.0015, 0.0062);
        foot.translate(x, y, z); foot.rotateY(side * Math.PI / 2); pieces.push(foot);
      }
    }
    const merged = mergeGeometries(pieces); pieces.forEach(g => g.dispose()); return merged;
  }, []);
  return <>
    <mesh geometry={geometry} castShadow><meshPhysicalMaterial color={BOND_FINISH.wire} metalness={1} roughness={0.24} /></mesh>
    <mesh geometry={feet} receiveShadow><meshPhysicalMaterial color={BOND_FINISH.foot} metalness={1} roughness={0.31} /></mesh>
  </>;
}

function BoardContacts() {
  const geometry = useMemo(() => {
    const pieces = [];
    for (let side = 0; side < 4; side++) for (let row = 0; row < 3; row++) for (let i = 0; i < 28; i++) {
      const piece = new BoxGeometry(0.013, 0.006, 0.018);
      piece.translate(-0.56 + i * 0.042, BOARD.top + 0.007, 1.014 + row * 0.021);
      piece.rotateY(side * Math.PI / 2); pieces.push(piece);
    }
    const merged = mergeGeometries(pieces); pieces.forEach(g => g.dispose()); return merged;
  }, []);
  return <mesh geometry={geometry}><meshPhysicalMaterial {...MAT.gold} /></mesh>;
}

/** Thin-film perforation detail, with an unbroken border around the shared circuit outline.
 * This is appearance only: the model and planar circuit geometry remain unchanged. */
function useGroundPerforations() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2048, 2048);
    ctx.fillStyle = '#000';
    for (let y = PERFORATIONS.start; y < PERFORATIONS.end; y += PERFORATIONS.pitch) for (let x = PERFORATIONS.start; x < PERFORATIONS.end; x += PERFORATIONS.pitch) {
      ctx.fillRect(x, y, PERFORATIONS.size, PERFORATIONS.size);
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = PERFORATIONS.border; ctx.lineJoin = 'round';
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      planContour(TOP_GROUND_PLAN).forEach(([x,z],i) => {
        const px = (x / CHIP.size + 0.5) * 2048, py = (sign * z / CHIP.size + 0.5) * 2048;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath(); ctx.stroke();
    }
    const map = new CanvasTexture(canvas); map.anisotropy = 16; return map;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

export function Ground({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const texture = useGroundTexture();
  const perforations = useGroundPerforations();
  const regions=useMemo(()=>[planGeometry(TOP_GROUND_PLAN,.002,false,0.00015),planGeometry(TOP_GROUND_PLAN,.002,true,0.00015)],[]);
  return (
    <PartGroup id="ground" explodeY={GROUND.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
      <BondWires />
      {regions.map((geometry,i)=><mesh key={i} geometry={geometry} rotation-x={-Math.PI/2} position-y={.002} receiveShadow><Material kind="ground" selected={selected} alphaMap={perforations}/>{selected&&<Edges color={ACCENT} lineWidth={1.2}/>}</mesh>)}
      <mesh rotation-x={-Math.PI / 2} position-y={0.0044} receiveShadow raycast={() => null}>
        <planeGeometry args={[GROUND.size, GROUND.size]} />
        <Material kind="ground" selected={selected} alphaMap={texture} />
      </mesh>
    </PartGroup>
  );
}

export function Capacitor({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const electrodes=useMemo(()=>[planGeometry(LEFT_ELECTRODE,PADS.height,false,0.0006),planGeometry(RIGHT_ELECTRODE,PADS.height,false,0.0006)],[]);
  return <PartGroup id="capacitor" explodeY={PADS.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
    {electrodes.map((geometry,i)=><mesh key={i} geometry={geometry} rotation-x={-Math.PI/2} position-y={.001} castShadow receiveShadow><Material kind="silver" selected={selected}/>{selected&&<Edges color={ACCENT} lineWidth={1.2}/>}</mesh>)}
  </PartGroup>;
}

function electrodeGeometry() {
  const shape = new Shape();
  JUNCTION_ELECTRODE.forEach(([x,y],i) => i === 0 ? shape.moveTo(x,y) : shape.lineTo(x,y));
  shape.closePath();
  return new ExtrudeGeometry(shape, {depth:0.005, bevelEnabled:true, bevelSize:0.0004, bevelThickness:0.0004, bevelSegments:2});
}

export function Junction({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const electrode = useMemo(() => electrodeGeometry(), []);
  return (
    <PartGroup id="junction" explodeY={JUNCTION.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
      {/* Two metal electrodes separated by a fixed aluminium-oxide tunnel barrier. */}
      <mesh geometry={electrode} rotation-x={-Math.PI / 2} position={[0, 0.009, 0]} castShadow>
        <Material kind="silver" selected={selected} />
        {selected && <Edges color={ACCENT} lineWidth={1.2} />}
      </mesh>
      <mesh position={[0, 0.0145, JUNCTION_OVERLAP.z]}>
        <boxGeometry args={[JUNCTION_OVERLAP.width, 0.0014, JUNCTION_OVERLAP.depth]} />
        <meshPhysicalMaterial color={JUNCTION_OVERLAP.color} metalness={0} roughness={0.46} clearcoat={0.16} />
      </mesh>
      <mesh geometry={electrode} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0.016, JUNCTION_OVERLAP.upperZ]} castShadow>
        <Material kind="silver" selected={selected} />
        {selected && <Edges color={ACCENT} lineWidth={1.2} />}
      </mesh>
      {/* Invisible hit volume so the tiny junction can be clicked. Excluded from framing bounds. */}
      <mesh position={[0, 0.03, 0]} userData={{ hit: true }}>
        <boxGeometry args={[0.16, 0.06, 0.12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </PartGroup>
  );
}

export function Gate({ selected, hidden, explode, onSelect, guides }: Omit<PartProps, 'id'>) {
  const geometry=useMemo(()=>planGeometry(GATE_PLAN,.008,false,0.00045),[]);
  return <PartGroup id="gate" explodeY={GATE.explodeY} explode={explode} hidden={hidden} onSelect={onSelect} guides={guides}>
    <mesh geometry={geometry} rotation-x={-Math.PI/2} position-y={.002} castShadow><Material kind="gold" selected={selected}/>{selected&&<Edges color={ACCENT} lineWidth={1.2}/>}</mesh>
    <mesh position={[(GATE.from+GATE.to)/2,.02,0]} userData={{hit:true}}><boxGeometry args={[GATE.to-GATE.from+.04,.05,.10]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>
  </PartGroup>;
}

const BUILDERS: Record<PartId, (p: Omit<PartProps, 'id'>) => React.JSX.Element> = {
  package: Package,
  board: Board,
  substrate: Substrate,
  ground: Ground,
  capacitor: Capacitor,
  junction: Junction,
  gate: Gate,
};

export const PART_ORDER: PartId[] = ['package', 'board', 'substrate', 'ground', 'capacitor', 'junction', 'gate'];

/** One part's meshes; shared by the main scene and the inspector detail preview. */
export function PartMeshes(props: PartProps) {
  const Builder = BUILDERS[props.id];
  const material = props.material ?? resolveMaterial(DEFAULT_COMPONENT_MATERIALS[props.id]);
  return <PartMaterial.Provider value={material}><PartColor.Provider value={props.color}><Builder {...props} /></PartColor.Provider></PartMaterial.Provider>;
}
