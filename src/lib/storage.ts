import type { Db } from './types';
import { uid } from './format';

export function BLANK(): Db {
  return { v: 2, bancas: [], activeBanca: null, methods: [], ops: [], cycles: [], teams: [], comps: [], settings: { unit: 'money' } };
}

export function freshAccount(): Db {
  const d = BLANK();
  d.bancas = [{ id: uid(), name: 'Banca principal', initial: 1000, stake: 20, createdAt: Date.now() }];
  d.activeBanca = d.bancas[0].id;
  return d;
}
