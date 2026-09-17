'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SavedDesigns from '@/components/SavedDesigns';
import ChipBuilder from '@/components/ChipBuilder';
import type { ShareableDesign } from '@/lib/design-link';
import AskLlm from '@/components/AskLlm';
import BuildWorkshop from '@/components/BuildWorkshop';
import LayoutWorkbench from '@/components/layout/LayoutWorkbench';
import type { ViewportHandle } from '@/components/Viewport3D';
import {
  workshopHidden,
  workshopParams,
  WORKSHOP_STEPS,
  type WorkshopChoices,
} from '@/lib/build-workshop';
import { topicFromPart, type TopicId } from '@/lib/explain-topics';
import { buildChipSnapshot } from '@/lib/insight-snapshot';
import { DEFAULT_PARAMS, clampParam, sameParams } from '@/lib/params';
import type { ParamKey } from '@/lib/params';
import type { PartId } from '@/lib/parts';
import { useEvaluate } from '@/lib/useEvaluate';
import type { DesignGoals, DeviceParams, DeviceResult } from '@/lib/types';
import { materialColor } from '@/lib/material-colors';
import type { MaterialAppearance } from '@/lib/material-colors';
import { useExperimentSession } from '@/lib/useExperimentSession';
import { completedDevice, validDeviceParams } from '@/lib/device-snapshot';
import { buildExportReport } from '@/lib/export-report';
import { validExperimentGoals } from '@/lib/experiment-session';
import { useComponentMaterials } from '@/lib/useComponentMaterials';
import { applyLayerMaterials, assignComponentMaterial } from '@/lib/component-material-selection';
import { DEFAULT_COMPONENT_MATERIALS } from '@/lib/component-materials';

const Viewport3D = dynamic(() => import('@/components/Viewport3D'), {
  ssr: false,
  loading: () => <p className="viewport-note">Starting 3D view…</p>,
});

const DEFAULT_GOALS: DesignGoals = {
  target_ghz: 5,
  tolerance_ghz: 0.25,
  min_anharmonicity_mhz: 200,
  max_dispersion_khz: 10,
};

const PRESETS: Record<string, DeviceParams> = {
  default: DEFAULT_PARAMS,
  reference: { ej_ghz: 30, ec_ghz: 1.2, ng: 0.3, ncut: 31 },
  protected: { ej_ghz: 18, ec_ghz: 0.22, ng: 0, ncut: 30 },
  anharmonic: { ej_ghz: 10, ec_ghz: 0.4, ng: 0, ncut: 30 },
};

export default function Page() {
  const [params, setParams] = useState<DeviceParams>(DEFAULT_PARAMS);
  const [selected, setSelected] = useState<PartId | null>('junction');
  const [hiddenParts, setHiddenParts] = useState<PartId[]>([]);
  const [mode, setMode] = useState<'explore' | 'design'>('explore');
  const [explode, setExplode] = useState(0);
  const [renderQuality, setRenderQuality] = useState<'balanced' | 'high'>('high');
  const [componentMaterials, updateComponentMaterials] = useComponentMaterials();
  const [baseline, setBaseline] = useState<DeviceResult | null>(null);
  const [goals, setGoals] = useState<DesignGoals>(DEFAULT_GOALS);
  const [materials, setMaterials] = useState<MaterialAppearance>({
    topMaterial: 'Al',
    baseMaterial: 'Si',
    topColor: materialColor('Al'),
    baseColor: materialColor('Si'),
  });

  const [selectedTopics, setSelectedTopics] = useState<Set<TopicId>>(new Set());
  const [llmOpen, setLlmOpen] = useState(false);
  const [mylaModal, setMylaModal] = useState(true);
  const tourActiveRef = useRef(false);
  const workshopActiveRef = useRef(false);
  const [workshopIndex, setWorkshopIndex] = useState<number | null>(null);
  const [workshopChoices, setWorkshopChoices] = useState<WorkshopChoices>({});

  const viewportRef = useRef<ViewportHandle | null>(null);

  const evaluation = useEvaluate(params);
  const { result, error, stale, status, retry } = evaluation;
  const experiments = useExperimentSession(params, goals, materials, baseline);

  // Build a compact snapshot for the LLM
  const snapshot = useMemo(
    () =>
      buildChipSnapshot({
        params,
        result,
        baseline,
        selected,
        explode,
        stale,
        error,
        goals,
        materials,
        componentMaterials,
        experiments: experiments.evidence,
      }),
    [params, result, baseline, selected, explode, stale, error, goals, materials, componentMaterials, experiments.evidence],
  );

  const topicsArray = useMemo(() => Array.from(selectedTopics), [selectedTopics]);

  const restoreDesign = useCallback((design: ShareableDesign) => {
    if (!validDeviceParams(design.params) || !validExperimentGoals(design.goals)) return;
    setParams({ ...design.params }); setGoals({ ...design.goals });
    setMaterials({ topMaterial: design.topMaterial, baseMaterial: design.baseMaterial,
      topColor: materialColor(design.topMaterial), baseColor: materialColor(design.baseMaterial) });
    updateComponentMaterials(() => design.componentMaterials
      ? { ...design.componentMaterials }
      : applyLayerMaterials({ ...DEFAULT_COMPONENT_MATERIALS }, design.topMaterial, design.baseMaterial));
    setMode('explore');
  }, [updateComponentMaterials]);

  const changeParam = useCallback((key: ParamKey, value: number) => {
    if (mode !== 'explore' || !Number.isFinite(value)) return;
    setParams((current) => ({ ...current, [key]: clampParam(key, value) }));
  }, [mode]);

  const applyMaterialScenario = useCallback((evaluated: DeviceParams) => {
    if (validDeviceParams(evaluated)) setParams({ ...evaluated });
  }, []);

  const changeMaterials = useCallback((topMaterial: string, baseMaterial: string) => {
    setMaterials({
      topMaterial,
      baseMaterial,
      topColor: materialColor(topMaterial),
      baseColor: materialColor(baseMaterial),
    });
    updateComponentMaterials(current => applyLayerMaterials(
      current,
      topMaterial !== materials.topMaterial ? topMaterial : undefined,
      baseMaterial !== materials.baseMaterial ? baseMaterial : undefined,
    ));
  }, [materials.topMaterial, materials.baseMaterial, updateComponentMaterials]);

  const changeComponentMaterial = useCallback((part: PartId, material: string) => {
    updateComponentMaterials(current => assignComponentMaterial(current, part, material));
    setSelectedTopics(current => new Set([...current, 'materials']));
  }, [updateComponentMaterials]);

  const askAbout = useCallback((id: TopicId) => {
    if (tourActiveRef.current || workshopActiveRef.current) return;
    setSelectedTopics(new Set([id]));
    setMylaModal(false);
    setLlmOpen(true);
  }, []);

  const onSelectTopic = askAbout;

  const clearTopics = useCallback(() => {
    setSelectedTopics(new Set());
  }, []);

  const triggerAskLlm = useCallback(() => {
    if (tourActiveRef.current || workshopActiveRef.current) return;
    const id = topicsArray[0] ?? 'f01';
    if (!topicsArray.length) setSelectedTopics(new Set([id]));
    setMylaModal(true);
    setLlmOpen(true);
  }, [topicsArray]);

  const selectPart = useCallback((id: PartId) => {
    setSelected(id);
    if (!workshopActiveRef.current) {
      setHiddenParts((current) => current.filter((part) => part !== id));
    }
    const next = topicFromPart(id);
    if (next) askAbout(next);
  }, [askAbout]);

  const clearSelection = useCallback(() => setSelected(null), []);

  const toggleVisible = useCallback((id: PartId) => {
    if (workshopActiveRef.current) return;
    setHiddenParts((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || llmOpen) return;
      if (event.target instanceof Element && event.target.closest('input, select, textarea, [role="dialog"]')) return;
      setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [llmOpen]);

  // Pinning is only meaningful for a completed calculation of the current parameters.
  const canPin = completedDevice(params, result, status, stale);
  const atDefaults = sameParams(params, DEFAULT_PARAMS);

  const statusBadge = error
    ? { className: 'badge err', text: 'Calculation failed' }
    : stale
      ? { className: 'badge stale', text: 'Updating…' }
      : status === 'ready'
        ? { className: 'badge live', text: 'Live result' }
        : { className: 'badge', text: 'Calculating…' };

  const applyWorkshopScene = useCallback((index: number, choices: WorkshopChoices) => {
    const step = WORKSHOP_STEPS[index];
    if (!step) return;
    setMode('explore');
    setHiddenParts(workshopHidden(index));
    if (choices.assembled === true) setExplode(0);
    else if (choices.assembled === false) setExplode(1);
    else if (step.explode !== undefined) setExplode(step.explode);
    if (step.part) setSelected(step.part);
    setParams(workshopParams(choices));
  }, []);

  const startWorkshop = useCallback(() => {
    workshopActiveRef.current = true;
    tourActiveRef.current = true;
    setLlmOpen(false);
    setWorkshopChoices({});
    setWorkshopIndex(0);
    applyWorkshopScene(0, {});
    setBaseline(null);
    setMaterials({
      topMaterial: 'Al',
      baseMaterial: 'Si',
      topColor: materialColor('Al'),
      baseColor: materialColor('Si'),
    });
    updateComponentMaterials(() => ({ ...DEFAULT_COMPONENT_MATERIALS }));
  }, [applyWorkshopScene, updateComponentMaterials]);

  const stopWorkshop = useCallback(() => {
    setWorkshopIndex(null);
    workshopActiveRef.current = false;
    tourActiveRef.current = false;
    setHiddenParts([]);
  }, []);

  const chooseWorkshop = useCallback((apply: Partial<WorkshopChoices>) => {
    const next = { ...workshopChoices, ...apply };
    setWorkshopChoices(next);
    applyWorkshopScene(workshopIndex ?? 0, next);
    const metal = apply.metal;
    const wafer = apply.wafer;
    if (metal || wafer) {
      setMaterials((materials) => {
        const top = metal ?? materials.topMaterial;
        const base = wafer ?? materials.baseMaterial;
        return {
          topMaterial: top,
          baseMaterial: base,
          topColor: materialColor(top),
          baseColor: materialColor(base),
        };
      });
      updateComponentMaterials((materials) => applyLayerMaterials(materials, metal, wafer));
    }
  }, [applyWorkshopScene, workshopChoices, workshopIndex, updateComponentMaterials]);

  const goWorkshop = useCallback((index: number) => {
    setWorkshopIndex(index);
    applyWorkshopScene(index, workshopChoices);
  }, [applyWorkshopScene, workshopChoices]);

  const exportReport = () => {
    const report = buildExportReport({ params, result, status, stale, goals, materials, componentMaterials, baseline, experiments: experiments.evidence });
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `qubit-studio-${Date.now()}.json`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Let browser download handlers consume the Blob before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <LayoutWorkbench
        builderTool={<ChipBuilder result={canPin ? result : null} onApplyElectrical={(ejGhz, ecGhz) => applyMaterialScenario({ ...params, ej_ghz: clampParam('ej_ghz', ejGhz), ec_ghz: clampParam('ec_ghz', ecGhz) })}/>}
        designTools={<SavedDesigns design={{ params, goals, topMaterial: materials.topMaterial, baseMaterial: materials.baseMaterial, componentMaterials }} onRestore={restoreDesign} />}
        mode={mode} onMode={setMode} status={statusBadge}
        componentMaterials={componentMaterials} onComponentMaterialChange={changeComponentMaterial}
        renderQuality={renderQuality} onRenderQuality={setRenderQuality}
        onTourActive={(active) => {
          if (active) {
            setWorkshopIndex(null);
            workshopActiveRef.current = false;
            setLlmOpen(false);
          }
          tourActiveRef.current = active || workshopActiveRef.current;
        }}
        onBuildChip={startWorkshop}
        buildingChip={workshopIndex !== null}
        hiddenParts={hiddenParts} onToggleVisible={toggleVisible}
        onRestoreInspectionView={(selection,hidden)=>{setSelected(selection);setHiddenParts(hidden);}}
        explode={explode} onExplode={setExplode} onReset3d={() => viewportRef.current?.resetView()}
        onExport={exportReport} canExport={canPin && validExperimentGoals(goals)}
        atDefaults={atDefaults}
        onPreset={(name) => { if (mode === 'explore' && PRESETS[name]) setParams(PRESETS[name]); }}
        onResetParams={() => { if (mode === 'explore') setParams(DEFAULT_PARAMS); }}
        inspector={{
          selected, params, result: canPin ? result : null, session: experiments,
          onSelect: selectPart, onChange: changeParam, onApplyMaterialScenario: applyMaterialScenario,
          goals, onGoalsChange: setGoals, onMaterialsChange: changeMaterials, materials,
          selectedTopics, onSelectTopic, onClearTopics: clearTopics, onAskLlm: triggerAskLlm,
        }}
        results={{
          result, baseline, stale, error, canPin,
          onPin: () => { if (canPin && result) setBaseline(structuredClone(result)); },
          onClearBaseline: () => setBaseline(null), onRetry: retry, goals,
          selectedTopics, onSelectTopic,
        }}
      >
        <Viewport3D selected={selected} hiddenParts={hiddenParts} explode={explode}
          onSelect={selectPart} onClearSelection={clearSelection} active
          handleRef={viewportRef} materialColors={{}} materials={componentMaterials} renderQuality={renderQuality}/>
      </LayoutWorkbench>
      {workshopIndex !== null && (
        <BuildWorkshop
          index={workshopIndex}
          choices={workshopChoices}
          solverReady={canPin}
          result={canPin ? result : null}
          onChoose={chooseWorkshop}
          onIndex={goWorkshop}
          onClose={stopWorkshop}
        />
      )}
      <AskLlm
        open={llmOpen}
        onOpenChange={setLlmOpen}
        topics={topicsArray}
        snapshot={snapshot}
        modal={mylaModal}
        onTopicsChange={topics => setSelectedTopics(new Set(topics))}
      />
    </>
  );
}
