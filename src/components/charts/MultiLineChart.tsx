import { useChartCanvas } from '../../hooks/useChartCanvas';
import { drawMulti, type NamedSeries } from '../../lib/canvas';
import type { Banca, Unit } from '../../lib/types';

export default function MultiLineChart({ labels, series, banca, unit, small }: { labels: string[]; series: NamedSeries[]; banca: Banca | undefined; unit: Unit; small?: boolean }) {
  const ref = useChartCanvas((cv) => drawMulti(cv, labels, series, banca, unit), [labels, series, banca, unit]);
  return (
    <div className={'chart-box' + (small ? ' sm' : '')}>
      <canvas ref={ref} />
    </div>
  );
}
