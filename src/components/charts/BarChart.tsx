import { useChartCanvas } from '../../hooks/useChartCanvas';
import { drawBars, type BarItem } from '../../lib/canvas';
import type { Banca, Unit } from '../../lib/types';

export default function BarChart({ items, banca, unit, small }: { items: BarItem[]; banca: Banca | undefined; unit: Unit; small?: boolean }) {
  const ref = useChartCanvas((cv) => drawBars(cv, items, banca, unit), [items, banca, unit]);
  return (
    <div className={'chart-box' + (small ? ' sm' : '')}>
      <canvas ref={ref} />
    </div>
  );
}
