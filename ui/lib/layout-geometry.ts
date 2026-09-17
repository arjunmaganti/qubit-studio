/** Canonical electrode outlines and inspection cameras; presentation only, never solver inputs. */
export const LAYOUT_BOUNDS = { x: 220, y: 30, width: 560, height: 560, centerX: 500, centerY: 310 };
export const LEFT_ELECTRODE = 'M210 235H350V265H375V277H397V286H417V293H436V299H451V304H465V307H487V313H465V316H451V321H436V327H417V334H397V343H375V355H350V385H210Z';
export const RIGHT_ELECTRODE = 'M790 235H650V265H625V277H603V286H583V293H564V299H549V304H535V307H513V313H535V316H549V321H564V327H583V334H603V343H625V355H650V385H790V329H711V291H790Z';
export interface LayoutCamera { x: number; y: number; zoom: number }
export const MIN_LAYOUT_ZOOM = 1;
export const MAX_LAYOUT_ZOOM = 24;
export const OVERVIEW_CAMERA: LayoutCamera = { x: LAYOUT_BOUNDS.centerX, y: LAYOUT_BOUNDS.centerY, zoom: MIN_LAYOUT_ZOOM };
/** Square-viewport default; inspectPart fits the same region to the actual pane aspect ratio. */
export const JUNCTION_CAMERA: LayoutCamera = { x: 500, y: 310, zoom: LAYOUT_BOUNDS.width / 100 };
const finiteOr = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
export function boundedCamera(camera: LayoutCamera): LayoutCamera {
  return {
    x: Math.max(100, Math.min(900, finiteOr(camera.x, OVERVIEW_CAMERA.x))),
    y: Math.max(70, Math.min(550, finiteOr(camera.y, OVERVIEW_CAMERA.y))),
    zoom: Math.max(MIN_LAYOUT_ZOOM, Math.min(MAX_LAYOUT_ZOOM, finiteOr(camera.zoom, MIN_LAYOUT_ZOOM))),
  };
}
/** 100% always means fit the entire illustration, independent of the viewport size. */
export function layoutViewBox(width: number, height: number, camera: LayoutCamera) {
  const aspect = Math.max(finiteOr(width, 1), 1) / Math.max(finiteOr(height, 1), 1);
  const fitWidth = Math.max(LAYOUT_BOUNDS.width, LAYOUT_BOUNDS.height * aspect);
  const fitHeight = fitWidth / aspect;
  const safeCamera = boundedCamera(camera);
  const w = fitWidth / safeCamera.zoom, h = fitHeight / safeCamera.zoom;
  return { x: safeCamera.x - w / 2, y: safeCamera.y - h / 2, width: w, height: h };
}
