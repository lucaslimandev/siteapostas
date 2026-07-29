import { cls, fmtV } from '../../lib/format';
import type { Banca, Unit } from '../../lib/types';

export interface RankItem {
  label: string;
  sub?: string;
  value: number;
}

export default function RankList({ items, banca, unit }: { items: RankItem[]; banca: Banca | undefined; unit: Unit }) {
  if (!items.length) return <p className="dim" style={{ margin: 0, fontSize: 13 }}>Sem dados ainda.</p>;
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <div className="rank">
      {items.map((i, idx) => (
        <div className="rank-row" key={idx}>
          <div className="lbl">
            {i.label}
            {i.sub && <small>{i.sub}</small>}
          </div>
          <div className={'val ' + cls(i.value)}>{fmtV(i.value, banca, unit)}</div>
          <div className="rank-bar">
            <i style={{ width: (Math.abs(i.value) / max) * 100 + '%', background: i.value >= 0 ? 'var(--mint)' : 'var(--coral)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
