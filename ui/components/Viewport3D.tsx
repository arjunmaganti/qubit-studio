'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ACESFilmicToneMapping, PCFShadowMap, Box3, Group, MathUtils, Mesh, Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import StudioLighting from './StudioLighting';
import { HardwareContext } from './layout/HardwareContext';
import { PART_ORDER, PartMeshes } from './Assembly';
import { fitDistanceInRegion, sceneRadius, viewOffset } from '@/lib/camera-fit';
import type { Rect } from '@/lib/camera-fit';
import { ANCHORS, FRAME, PARTS_GEOMETRY } from '@/lib/chip-geometry';
import type { Projected } from '@/lib/connector';
import type { PartId } from '@/lib/parts';
import { DEFAULT_COMPONENT_MATERIALS, resolveMaterial, type ComponentMaterials } from '@/lib/component-materials';
import { projectedBounds } from '@/lib/geometry-bounds';

export interface ViewportHandle {
  resetView: () => void;
}

/** Default pose: front-left, elevated, the reference's angle. Unit direction from target to camera. */
const AZIMUTH = (-34 * Math.PI) / 180;
const ELEVATION = (51 * Math.PI) / 180;
const DEFAULT_DIRECTION = new Vector3(
  Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.cos(AZIMUTH),
);
const EXPLODED_ELEVATION = (28 * Math.PI) / 180;
const EXPLODED_DIRECTION = new Vector3(
  Math.cos(EXPLODED_ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(EXPLODED_ELEVATION),
  Math.cos(EXPLODED_ELEVATION) * Math.cos(AZIMUTH),
);
/** Fill this fraction of the free region's limiting angle. */
const FILL = 0.97;

/** Three.js owns these mutable camera/control objects; React only selects the inspection mode. */
function setInspectionLimits(camera: PerspectiveCamera, controls: OrbitControlsImpl | null, isolatedRadius: number | null) {
  camera.near = isolatedRadius === null ? 0.1 : Math.max(0.0001, Math.min(0.01, isolatedRadius * 0.02));
  if (controls) controls.minDistance = isolatedRadius === null ? 1 : Math.max(0.005, isolatedRadius * 1.05);
}

interface FramingProps {
  region: Rect | null;
  isolatedPart: PartId | null;
  explodeTarget: number;
  /** True once the explode animation has settled, so the refinement measures final positions. */
  settled: boolean;
  assemblyRef: React.RefObject<Group | null>;
  fitRef: React.RefObject<((resetPose: boolean) => void) | null>;
}

/**
 * Overlay-aware framing. The bounding sphere is fitted to the unobstructed region and the
 * projection is sheared so the orbit target projects to the region centre. Re-fits on canvas size,
 * region or explode change; user zoom persists until the next of those.
 */
function Framing({ region, isolatedPart, explodeTarget, settled, assemblyRef, fitRef }: FramingProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((state) => state.invalidate);
  // Once the user has orbited or zoomed, automatic refits only dolly OUT (never undo a zoom-out);
  // Reset view clears the flag and restores the reference framing.
  const userMovedRef = useRef(false);
  const previousIsolation = useRef<PartId | null>(null);
  const beforeIsolation = useRef<{ position: Vector3; target: Vector3; view: PerspectiveCamera['view']; userMoved: boolean } | null>(null);

  useEffect(() => {
    if (!controls) return undefined;
    const onEnd = () => {
      userMovedRef.current = true;
    };
    controls.addEventListener('end', onEnd);
    return () => controls.removeEventListener('end', onEnd);
  }, [controls]);

  useEffect(() => {
    const isolationChanged = previousIsolation.current !== isolatedPart;
    if (isolationChanged && isolatedPart && !previousIsolation.current) {
      beforeIsolation.current = {
        position: camera.position.clone(), target: controls?.target.clone() ?? new Vector3(),
        view: camera.view ? { ...camera.view } : null, userMoved: userMovedRef.current,
      };
    }
    const restore = isolationChanged && !isolatedPart ? beforeIsolation.current : null;
    previousIsolation.current = isolatedPart;
    const fit = (resetPose: boolean) => {
      if (resetPose) userMovedRef.current = false;
      if (!('isPerspectiveCamera' in camera)) return;
      const canvas = { x: 0, y: 0, width: size.width, height: size.height };
      const free = region ?? canvas;
      const assembly = assemblyRef.current;
      const isolatedBounds = new Box3();
      if (isolatedPart && assembly) {
        assembly.updateWorldMatrix(true, true);
        assembly.traverseVisible(object => {
          if (!(object instanceof Mesh) || object.userData.hit || object.type.startsWith('Line')) return;
          if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
          if (object.geometry.boundingBox && !object.geometry.boundingBox.isEmpty()) {
            isolatedBounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
          }
        });
      }
      const isolatedRadius = isolatedBounds.isEmpty() ? null : isolatedBounds.getSize(new Vector3()).length() / 2;
      const radius = (isolatedRadius ?? sceneRadius(explodeTarget, PARTS_GEOMETRY)) / FILL;
      // Only an isolated component can use close-up limits: keep the orbit outside its geometry.
      setInspectionLimits(camera, controls, isolatedRadius);
      const distance = fitDistanceInRegion(radius, camera.fov, size.height, free.width, free.height);
      if (!Number.isFinite(distance)) return;
      const { dx, dy } = viewOffset(canvas, free);
      // Extra shear so the projected bounds' centre (not the orbit target) lands on the region centre.
      let cx = 0;
      let cy = 0;
      const offset = () => camera.setViewOffset(size.width, size.height, -(dx + cx), -(dy + cy), size.width, size.height);
      offset();
      const target = controls?.target ?? new Vector3();
      if (isolatedRadius !== null && (resetPose || !userMovedRef.current)) isolatedBounds.getCenter(target);
      else if (resetPose) target.set(0, 0, 0);
      const defaultDirection = explodeTarget > 0 ? EXPLODED_DIRECTION : DEFAULT_DIRECTION;
      const direction = resetPose || !userMovedRef.current ? defaultDirection.clone() : camera.position.clone().sub(target);
      if (direction.lengthSq() === 0) direction.copy(DEFAULT_DIRECTION);
      const currentDistance = direction.length();
      const floor = (d: number) => (userMovedRef.current && !resetPose ? Math.max(d, currentDistance) : d);
      const place = (d: number) => {
        camera.position.copy(target).add(direction.clone().setLength(d));
        camera.lookAt(target);
        camera.updateMatrixWorld(true);
        camera.updateProjectionMatrix();
      };
      place(floor(distance));
      // The sphere is conservative for a flat, square object: refine size and centring against the
      // real projected extent of the rendered meshes.
      if (assembly && settled && !isolatedPart) {
        assembly.updateWorldMatrix(true, true);
        let d = distance;
        for (let i = 0; i < 4; i += 1) {
          const bounds = projectedBounds(assembly, camera, size.width, size.height);
          if (!bounds) break;
          const w = bounds.right - bounds.left;
          const h = bounds.bottom - bounds.top;
          const scale = Math.max(w / free.width, h / free.height) / FILL;
          if (!Number.isFinite(scale) || scale <= 0) break;
          cx += free.x + free.width / 2 - (bounds.left + w / 2);
          cy += free.y + free.height / 2 - (bounds.top + h / 2);
          d = floor(d * scale);
          offset();
          place(d);
        }
      }
      controls?.update();
      invalidate();
    };
    fitRef.current = fit;
    if (restore) {
      camera.position.copy(restore.position);
      const view = restore.view;
      if (view?.enabled) camera.setViewOffset(size.width, size.height,
        view.offsetX * size.width / view.fullWidth, view.offsetY * size.height / view.fullHeight, size.width, size.height);
      else camera.clearViewOffset();
      setInspectionLimits(camera, controls, null);
      if (controls) { controls.target.copy(restore.target); controls.update(); }
      camera.lookAt(restore.target);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      userMovedRef.current = restore.userMoved;
      beforeIsolation.current = null;
      invalidate();
    } else fit(isolationChanged);
  }, [size.width, size.height, region, isolatedPart, explodeTarget, settled, camera, controls, fitRef, assemblyRef, invalidate]);

  return null;
}

interface ProjectorProps {
  selected: PartId | null;
  explodeRef: React.RefObject<number>;
  anchorRef: React.RefObject<Projected | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  assemblyRef: React.RefObject<Group | null>;
}

const scratch = new Vector3();

/**
 * Per-frame instrumentation. Writes the selected anchor's NDC for the callout line and the
 * projected bounds of the visible rendered meshes (hit volumes and guide lines excluded) to
 * `data-bounds` on the wrapper, so browser QA can check the framing against real geometry.
 */
function Projector({ selected, explodeRef, anchorRef, wrapperRef, assemblyRef }: ProjectorProps) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const size = useThree((state) => state.size);

  useFrame(() => {
    if (selected) {
      const a = ANCHORS[selected];
      scratch.set(a.point[0], a.point[1] + a.explodeY * explodeRef.current, a.point[2]);
      const view = scratch.clone().applyMatrix4(camera.matrixWorldInverse);
      scratch.project(camera);
      anchorRef.current = { x: scratch.x, y: scratch.y, z: scratch.z, w: -view.z };
    } else {
      anchorRef.current = null;
    }

    const wrapper = wrapperRef.current;
    const assembly = assemblyRef.current;
    if (!wrapper || !assembly) return;
    if (controls) wrapper.dataset.cameraDistance = camera.position.distanceTo(controls.target).toFixed(5);
    wrapper.dataset.cameraNear = camera.near.toString();
    const bounds = projectedBounds(assembly, camera as PerspectiveCamera, size.width, size.height);
    if (bounds) {
      wrapper.dataset.bounds = `${bounds.left.toFixed(1)},${bounds.top.toFixed(1)},${bounds.right.toFixed(1)},${bounds.bottom.toFixed(1)}`;
    } else {
      delete wrapper.dataset.bounds;
    }
  });

  return null;
}

/** Smooths the Assembled/Exploded target; re-renders only while the value is moving. */
function useSmoothedExplode(target: number, explodeRef: React.RefObject<number>): number {
  const [value, setValue] = useState(target);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [target, invalidate]);
  useFrame((_, delta) => {
    const current = explodeRef.current;
    if (Math.abs(current - target) < 0.002) {
      if (current !== target) {
        explodeRef.current = target;
        setValue(target);
        invalidate();
      }
      return;
    }
    // The first frame after an idle period can have a large delta.
    const next = MathUtils.damp(current, target, 7, Math.min(delta, 0.1));
    explodeRef.current = next;
    setValue(next);
    invalidate();
  });
  return value;
}

interface SceneProps {
  selected: PartId | null;
  hiddenParts: PartId[];
  explode: number;
  region: Rect | null;
  materialColors?: Partial<Record<PartId,string>>;
  materials?: ComponentMaterials;
  renderQuality?: 'balanced' | 'high';
  onSelect: (id: PartId) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  fitRef: React.RefObject<((resetPose: boolean) => void) | null>;
  anchorRef: React.RefObject<Projected | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

function Scene({ selected, hiddenParts, explode, region, onSelect, controlsRef, fitRef, anchorRef, wrapperRef, materialColors = {}, materials, renderQuality = 'high' }: SceneProps) {
  const explodeRef = useRef(explode);
  const assemblyRef = useRef<Group | null>(null);
  const smooth = useSmoothedExplode(explode, explodeRef);
  const floorY = FRAME.top - FRAME.depth + FRAME.explodeY * smooth - 0.012;
  const visibleParts = PART_ORDER.filter(id => !hiddenParts.includes(id));
  const isolatedPart = visibleParts.length === 1 ? visibleParts[0] : null;

  return (
    <>
      <StudioLighting quality={renderQuality} />

      <group ref={assemblyRef}>
        {PART_ORDER.map((id) => (
          <PartMeshes
            key={id}
            id={id}
            color={materialColors[id]}
            material={resolveMaterial(materials?.[id] ?? DEFAULT_COMPONENT_MATERIALS[id])}
            selected={selected === id}
            hidden={hiddenParts.includes(id)}
            explode={smooth}
            onSelect={onSelect}
            guides={!isolatedPart}
          />
        ))}
      </group>

      {/* This soft shadow stays at a fixed resolution so quality changes reuse its render targets. */}
      <ContactShadows position={[0, floorY, 0]} scale={4.5} blur={2.3} opacity={0.44} far={1.1} resolution={1024} frames={Infinity} />

      <Framing region={region} isolatedPart={isolatedPart} explodeTarget={explode} settled={smooth === explode} assemblyRef={assemblyRef} fitRef={fitRef} />
      <Projector selected={selected} explodeRef={explodeRef} anchorRef={anchorRef} wrapperRef={wrapperRef} assemblyRef={assemblyRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.12}
        minDistance={1}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.62}
      />
    </>
  );
}

interface Viewport3DProps extends Omit<SceneProps, 'controlsRef' | 'fitRef' | 'region' | 'anchorRef' | 'wrapperRef'> {
  /** False while the schematic-only view hides the canvas: rendering pauses. */
  active: boolean;
  onClearSelection: () => void;
  handleRef: React.RefObject<ViewportHandle | null>;
}

export default function Viewport3D({
  selected,
  hiddenParts,
  explode,
  onSelect,
  active: activeProp,
  onClearSelection,
  handleRef,
  materialColors,
  materials,
  renderQuality = 'high',
}: Viewport3DProps) {
  const interaction=useContext(HardwareContext);
  const active=interaction?.active??activeProp;
  const select=interaction?.onSelect??onSelect;
  const visibleHiddenParts=interaction?.hiddenPartsOverride??hiddenParts;
  const anchorRef = useRef<Projected | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const fitRef = useRef<((resetPose: boolean) => void) | null>(null);
  const [renderState, setRenderState] = useState<'loading' | 'ready' | 'failed'>(() => {
    if (typeof document === 'undefined') return 'loading';
    try {
      const probe = document.createElement('canvas');
      return probe.getContext('webgl2') || probe.getContext('webgl') ? 'loading' : 'failed';
    } catch {
      return 'failed';
    }
  });

  useImperativeHandle(handleRef, () => ({
    resetView: () => fitRef.current?.(true),
  }));

  useEffect(
    () => () => {
      document.body.style.cursor = '';
      anchorRef.current = null;
    },
    [anchorRef],
  );

  return (
    <div ref={wrapperRef} className="hardware-canvas" data-selected={selected??''} data-hidden-parts={visibleHiddenParts.join(',')} data-explode={explode} data-render-quality={renderQuality}>
    {renderState !== 'ready' && <div className={`hardware-canvas-message ${renderState}`} role="status">
      <div className="hardware-fallback-chip" aria-hidden="true"><span/><span/><i/></div>
      <strong>{renderState === 'failed' ? '3D is unavailable in this browser' : 'Loading the 3D chip…'}</strong>
      <span>{renderState === 'failed' ? 'Enable hardware acceleration or try another browser. The layout and simulation still work.' : 'Preparing the interactive model.'}</span>
    </div>}
    {renderState !== 'failed' && <Canvas
      fallback={<div className="hardware-canvas-message failed"><strong>3D is unavailable in this browser</strong><span>The layout and simulation still work.</span></div>}
      camera={{ position: DEFAULT_DIRECTION.clone().multiplyScalar(5).toArray(), fov: 30, near: 0.1, far: 60 }}
      dpr={renderQuality === 'high' ? [2, 2.5] : [1, 1.5]}
      // Keep the full-quality image while idle. Controls, edits and explode
      // animation request frames; an unchanged chip does not consume the GPU.
      frameloop={active ? 'demand' : 'never'}
      shadows={{ type: PCFShadowMap }}
      onPointerMissed={onClearSelection}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onCreated={({ gl }) => {
        setRenderState('ready');
        gl.transmissionResolutionScale = 0.5;
        gl.domElement.addEventListener('webglcontextlost', () => setRenderState('failed'), { once: true });
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Scene
        selected={selected}
        hiddenParts={visibleHiddenParts}
        explode={explode}
        region={null}
        materialColors={materialColors}
        materials={materials}
        renderQuality={renderQuality}
        onSelect={select}
        controlsRef={controlsRef}
        fitRef={fitRef}
        anchorRef={anchorRef}
        wrapperRef={wrapperRef}
      />
    </Canvas>}
    </div>
  );
}
