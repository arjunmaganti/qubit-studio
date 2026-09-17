'use client';

import { useEvaluate } from '@/lib/useEvaluate';
import { completedDevice } from '@/lib/device-snapshot';
import MathText from '@/components/MathText';
import { DASH, dispersionDisplay, num } from '@/lib/format';
import { mathValue } from '@/lib/math-format';
import type { DeviceParams, DeviceResult } from '@/lib/types';

interface ChargeQubitPeerProps {
  params: DeviceParams;
  result: DeviceResult;
  enabled: boolean;
}

/**
 * Second solver call at EJ = EC (ratio 1), same ng and ncut.
 * Shows why transmons exist: same charging energy, wildly different charge noise.
 */
export default function ChargeQubitPeer({ params, result, enabled }: ChargeQubitPeerProps) {
  const peerParams = { ...params, ej_ghz: params.ec_ghz };
  const evaluation = useEvaluate(peerParams);
  const peer = enabled && completedDevice(peerParams, evaluation.result, evaluation.status, evaluation.stale) ? evaluation.result : null;
  const error = evaluation.error;

  const thisDisp = dispersionDisplay(result);
  const peerDisp = dispersionDisplay(peer);

  return (
    <div className="physics-compare" data-tour="charge-peer">
      <h4><MathText text="Same $E_C$, charge-qubit $E_J$" /></h4>
      <p className="cap">
        <MathText text="Extra solver run at $E_J = E_C$ (ratio 1). Same charging energy, no extra invention — the quietness of a transmon is the point." />
      </p>
      {error && <p className="empty">{error}</p>}
      <div className="compare-row">
        <span />
        <strong>This chip</strong>
        <strong>Charge qubit</strong>
        <span><MathText math="E_J/E_C" /></span>
        <span><MathText math={num(result.ratio, 1)} /></span>
        <span>{peer ? <MathText math={num(peer.ratio, 1)} /> : DASH}</span>
        <span><MathText math="f_{01}" /></span>
        <span><MathText math={mathValue(result.f01_ghz, 3, 'GHz')} /></span>
        <span>{peer ? <MathText math={mathValue(peer.f01_ghz, 3, 'GHz')} /> : DASH}</span>
        <span>Charge wiggle</span>
        <span><MathText text={thisDisp.text} /></span>
        <span>{peer ? <MathText text={peerDisp.text} /> : DASH}</span>
      </div>
    </div>
  );
}
