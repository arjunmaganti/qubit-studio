'use client';

import GeometryEditor from './GeometryEditor';
import { useState } from 'react';
import ParamField from './ParamField';
import MaterialSensitivity from './MaterialSensitivity';
import DesignLab from './DesignLab';
import { MODELED_PARTS, PART_BY_ID } from '@/lib/parts';
import type { PartId } from '@/lib/parts';
import { PARAMS } from '@/lib/params';
import type { ParamKey } from '@/lib/params';
import { num } from '@/lib/format';
import type { DesignGoals, DeviceParams, DeviceResult } from '@/lib/types';
import type { MaterialAppearance } from '@/lib/material-colors';
import type { TopicId } from '@/lib/explain-topics';
import type { ExperimentSession } from '@/lib/useExperimentSession';

interface InspectorProps {
  selected: PartId | null;
  params: DeviceParams;
  result: DeviceResult | null;
  onSelect: (id: PartId) => void;
  onChange: (key: ParamKey, value: number) => void;
  onApplyMaterialScenario: (params: DeviceParams) => void;
  session: ExperimentSession;
  goals: DesignGoals;
  onGoalsChange: (goals: DesignGoals) => void;
  onMaterialsChange: (topMaterial: string, baseMaterial: string) => void;
  materials: MaterialAppearance;
  selectedTopics: Set<TopicId>;
  onSelectTopic: (id: TopicId) => void;
  onClearTopics: () => void;
  onAskLlm: () => void;
}

export default function Inspector({
  selected,
  params,
  result,
  session,
  onSelect,
  onChange,
  onApplyMaterialScenario,
  goals,
  onGoalsChange,
  onMaterialsChange,
  materials,
}: InspectorProps) {
  const part = selected ? PART_BY_ID[selected] : null;
  const [tab, setTab] = useState<'edit' | 'experiment' | 'materials'>('edit');

  return (
    <>
      <div className="panel-head">Controls</div>
      <div className="inspector-tabs" role="tablist" aria-label="Control sections">
        {([
          ['edit', 'Edit chip'],
          ['experiment', 'Try a goal'],
          ['materials', 'Materials'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls="inspector-panel" tabIndex={tab === id ? 0 : -1} aria-selected={tab === id} onClick={() => setTab(id)} onKeyDown={(event) => {
            const ids = ['edit', 'experiment', 'materials'] as const;
            const index = ids.indexOf(id);
            const next = event.key === 'ArrowRight' ? ids[(index + 1) % ids.length] : event.key === 'ArrowLeft' ? ids[(index + ids.length - 1) % ids.length] : event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[ids.length - 1] : null;
            if (next) { event.preventDefault(); setTab(next); document.getElementById(`tab-${next}`)?.focus(); }
          }}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="inspector-panel" aria-labelledby={`tab-${tab}`} tabIndex={0}>

      {tab === 'edit' && !part && (
        <div className="insp-section">
          <div className="insp-title">What do you want to change?</div>
          <p className="insp-role">
            Choose one chip property. The simulation updates automatically.
          </p>
          <div className="row-actions">
            {MODELED_PARTS.map((p) => (
              <button key={p.id} type="button" className="btn" onClick={() => onSelect(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'edit' && part && (
        <div className="insp-section">
          <div className="insp-title">
            <span className="swatch" style={{ background: part.color, width: 10, height: 10, borderRadius: 2, border: '1px solid rgba(0,0,0,.35)' }} />
            {part.name}
          </div>
          <p className="insp-role">{part.role}</p>

          {part.param && (
            <>
              <ParamField paramKey={part.param} value={params[part.param]} onChange={onChange} />
              <details className="tech">
                <summary>Technical detail</summary>
                <div className="body">
                  <p style={{ margin: 0 }}>{PARAMS[part.param].meaning}</p>
                  <dl>
                    <dt>{PARAMS[part.param].symbol}</dt>
                    <dd>
                      {num(params[part.param], PARAMS[part.param].digits)}{' '}
                      {PARAMS[part.param].unit || '(dimensionless)'}
                    </dd>
                    <dt>range</dt>
                    <dd>
                      {PARAMS[part.param].min} … {PARAMS[part.param].max}
                    </dd>
                    {part.param !== 'ng' && result && (
                      <>
                        <dt>EJ/EC</dt>
                        <dd>{num(result.ratio, 1)}</dd>
                      </>
                    )}
                  </dl>
                  {part.param === 'ej_ghz' && (
                    <p style={{ margin: '6px 0 0' }}>
                      EJ and EC are independent inputs here. The transition frequency is an output of the
                      solver, not a target you set.
                    </p>
                  )}
                  {part.param === 'ng' && (
                    <p style={{ margin: '6px 0 0' }}>
                      Sweeping ng from 0 to 1 traces the charge-dispersion curve in the results dock.
                    </p>
                  )}
                </div>
              </details>
            </>
          )}

          {!part.modeled && (
            <p className="illus">
              Drawn for context. This part has no properties in the current model — its size, thickness and
              appearance do not change any calculated value.
            </p>
          )}
        </div>
      )}

      {tab === 'experiment' && <DesignLab
          session={session}
          params={params}
          result={result}
          goals={goals}
          onGoalsChange={onGoalsChange}
          onApply={onApplyMaterialScenario}
          onMaterialsChange={onMaterialsChange}
          currentMaterials={materials}
        />}

      {tab === 'materials' && <MaterialSensitivity
          session={session}
          params={params}
          result={result}
          onApply={onApplyMaterialScenario}
          onMaterialsChange={onMaterialsChange}
          topMaterial={materials.topMaterial}
          baseMaterial={materials.baseMaterial}
        />}

      {tab === 'edit' && <div className="insp-section quiet-section">
          <GeometryEditor key={`${params.ej_ghz}-${params.ec_ghz}`} params={params} onApply={(ej_ghz, ec_ghz) => onApplyMaterialScenario({ ...params, ej_ghz, ec_ghz })} />
          <details className="tech">
            <summary>Advanced solver setting</summary>
            <div className="body">
              <ParamField paramKey="ncut" value={params.ncut} onChange={onChange} />
              <p style={{ margin: '8px 0 0' }}>{PARAMS.ncut.meaning}</p>
            </div>
          </details>
          <p className="model-note">
            Educational transmon model{result ? ` · ${result.model_version}` : ''}. It shows trends, not the
            guaranteed behavior of a manufactured chip.
          </p>
        </div>}
      </div>
    </>
  );
}
