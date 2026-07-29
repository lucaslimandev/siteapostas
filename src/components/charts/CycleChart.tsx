import { useChartCanvas } from '../../hooks/useChartCanvas';
import { drawCycleChart } from '../../lib/canvas';
import type { Cycle } from '../../lib/types';
import type { CycleResult } from '../../lib/engine';

export default function CycleChart({ cycle, result }: { cycle: Cycle; result: CycleResult }) {
  const ref = useChartCanvas((cv) => drawCycleChart(cv, cycle, result), [cycle, result]);
  return (
    <div className="chart-box">
      <canvas ref={ref} />
    </div>
  );
}
