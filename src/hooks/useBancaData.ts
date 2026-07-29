import { useMemo } from 'react';
import { useDbStore } from './useDbStore';
import { banca as pickBanca, enrich } from '../lib/engine';

/** Banca ativa + operações enriquecidas (ordenadas, com stake esperada, off-plano, saldo acumulado). */
export function useBancaData() {
  const db = useDbStore((s) => s.db);
  const banca = pickBanca(db);
  const unit = db.settings.unit;
  const enriched = useMemo(() => enrich(db.ops, banca, db.methods, db.cycles), [db.ops, banca, db.methods, db.cycles]);
  return { db, banca, unit, enriched };
}
