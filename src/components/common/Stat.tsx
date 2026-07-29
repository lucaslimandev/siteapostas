import type { ReactNode } from 'react';

export default function Stat({ label, value, sub, valueClass }: { label: string; value: ReactNode; sub?: ReactNode; valueClass?: string }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b className={valueClass}>{value}</b>
      {sub != null && <div className="sub">{sub}</div>}
    </div>
  );
}
