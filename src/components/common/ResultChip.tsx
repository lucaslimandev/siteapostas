import Chip from './Chip';
import { fmtV } from '../../lib/format';
import type { Banca, Result, Unit } from '../../lib/types';

export default function ResultChip({ result, pnl, banca, unit }: { result: Result; pnl: number; banca: Banca | undefined; unit: Unit }) {
  if (result === 'green') return <Chip kind="win">{fmtV(pnl, banca, unit)}</Chip>;
  if (result === 'red') return <Chip kind="loss">{fmtV(pnl, banca, unit)}</Chip>;
  return <Chip>anulada</Chip>;
}
