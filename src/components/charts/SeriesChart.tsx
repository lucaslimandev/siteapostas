import { useChartCanvas } from '../../hooks/useChartCanvas';
import { drawSeries } from '../../lib/canvas';
import type { Bucket, Banca, Unit } from '../../lib/types';

export default function SeriesChart({ buckets, mode, banca, unit }: { buckets: Bucket[]; mode: 'both' | 'bars' | 'line'; banca: Banca | undefined; unit: Unit }) {
  const ref = useChartCanvas((cv) => drawSeries(cv, buckets, mode, banca, unit), [buckets, mode, banca, unit]);
  return (
    <div className="chart-box">
      <canvas ref={ref} />
    </div>
  );
}
