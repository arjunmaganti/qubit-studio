'use client';
import { useState, type ComponentProps } from 'react';
import { ChevronDown, Download, Pin, Settings2, X } from 'lucide-react';
import MathText from '@/components/MathText';
import ResultsDock from '@/components/ResultsDock';
import { delta, dispersionDisplay, num, paramSummary } from '@/lib/format';
import type { TopicId } from '@/lib/explain-topics';

type Props = ComponentProps<typeof ResultsDock> & { onSolver:()=>void; onExport:()=>void; canExport:boolean; design:boolean; tourExpanded?:boolean };
export default function LayoutResults(props: Props) {
  const [expanded,setExpanded]=useState(false);
  const { result,baseline,canPin,stale,error,onPin,onClearBaseline,onRetry }=props;
  const dispersion=dispersionDisplay(result), pinnedDispersion=dispersionDisplay(baseline);
  const metrics: Array<{id:TopicId; label:string; value:string; pinned:string; difference:string|null; note?:string}>=[
    {id:'f01',label:'Transition frequency · f01',value:result?`${num(result.f01_ghz,3)} GHz`:'—',pinned:baseline?`${num(baseline.f01_ghz,3)} GHz`:'—',difference:delta(result?.f01_ghz,baseline?.f01_ghz,3,'GHz')?.text??null},
    {id:'alpha',label:'Anharmonicity · |α|',value:result?`${num(result.anharmonicity_mhz,1)} MHz`:'—',pinned:baseline?`${num(baseline.anharmonicity_mhz,1)} MHz`:'—',difference:delta(result?.anharmonicity_mhz,baseline?.anharmonicity_mhz,1,'MHz')?.text??null},
    {id:'dispersion',label:'Charge dispersion',value:dispersion.text,pinned:pinnedDispersion.text,difference:dispersion.resolved&&pinnedDispersion.resolved?(delta(result?.dispersion_khz,baseline?.dispersion_khz,3,'kHz')?.text??null):null,note:dispersion.note},
  ];
  return <div className={`layout-results${expanded||props.tourExpanded?' is-expanded':''}`}>
    <div className="layout-results-toolbar"><div className="results-identity"><strong>Results</strong><span className={canPin?'is-current':''}>{props.design?'Applied device · ':''}{error?'Calculation failed':canPin?'Current':result?'Updating…':'Calculating…'}</span></div><span className="spacer"/>
      <details className="layout-popover results-actions"><summary>Actions <ChevronDown size={14}/></summary><div>
      <button onClick={onPin} disabled={!canPin}><Pin size={14}/>{baseline?'Replace baseline':'Pin baseline'}</button>
      {baseline&&<button onClick={onClearBaseline}><X size={14}/>Clear baseline</button>}
      <button onClick={props.onSolver}><Settings2 size={14}/>Solver settings</button>
      <button onClick={props.onExport} disabled={!props.canExport}><Download size={14}/>Export report</button>
      </div></details>
      <button className="results-expand" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded||!!props.tourExpanded} aria-controls="layout-expanded-results"><ChevronDown size={14}/>{expanded?'Hide graphs & details':'Details & compare'}</button>
    </div>
    {(!canPin||error) && <div className={`layout-result-state${error?' is-error':''}`} role="status">{error?`Calculation failed. ${error}`:result?'Updating… Previous values are outdated.':'Calculating the first result…'}{error&&<button onClick={onRetry}>Retry calculation</button>}</div>}
    <div className="layout-result-metrics" data-current={canPin}>
      {metrics.map(metric=><button key={metric.id} data-tour={`metric-${metric.id}`} className={`layout-result-metric${props.selectedTopics.has(metric.id)?' is-selected':''}`} aria-label={`${metric.label}: ${metric.value}. ${metric.difference??''}. Select for AI explanation`} aria-pressed={props.selectedTopics.has(metric.id)} onClick={()=>props.onSelectTopic(metric.id)}>
        <span className="layout-result-label"><MathText text={metric.label} /></span><strong className="layout-result-value"><MathText text={metric.value} /></strong>
        {baseline&&<span className="layout-result-comparison"><span><MathText text={canPin?metric.difference??'Difference unresolved': 'Comparison awaits current result'} /></span><small>Pinned <MathText text={metric.pinned} /></small></span>}
        {metric.note&&<small className="layout-result-note">{metric.note}</small>}
      </button>)}
    </div>
    <div className="layout-results-footnote"><span>{stale?'Previous calculation':'Calculated parameters'} · <MathText text={paramSummary(result)} /></span><span><MathText text={baseline?`Frozen baseline · ${paramSummary(baseline)}`:'Illustrative geometry · not fabrication-calibrated'} /></span></div>
    {(expanded||props.tourExpanded)&&<section id="layout-expanded-results" className="layout-expanded-results" aria-label="Expanded results and energy levels"><ResultsDock {...props} chartsOpen goalHint="Open Design to find settings that meet your goals."/></section>}
  </div>;
}
