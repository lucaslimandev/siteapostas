import { create } from 'zustand';
import type { Banca, Cycle, Db, Method, Op, Unit } from '../lib/types';
import { BLANK, freshAccount } from '../lib/storage';
import { demoData } from '../lib/demoData';
import { uid } from '../lib/format';

export type DataMode = 'demo' | 'cloud';

interface DbState {
  db: Db;
  mode: DataMode;
  cloudPush: (() => void) | null;

  setCloudPush: (fn: (() => void) | null) => void;
  loadDb: (db: Db, mode: DataMode) => void;
  /** Aplica um snapshot vindo do Firestore sem disparar push de volta pro servidor. */
  applyRemote: (db: Db) => void;

  setUnit: (u: Unit) => void;
  setActiveBanca: (id: string) => void;

  addOp: (data: Omit<Op, 'id' | 'bancaId' | 'seq' | 'cycleId'>, cycleId: string | null) => void;
  updateOp: (id: string, data: Partial<Op>) => void;
  deleteOp: (id: string) => void;

  addCycle: (data: Omit<Cycle, 'id' | 'bancaId' | 'createdAt'>) => string;
  updateCycle: (id: string, data: Partial<Cycle>) => void;
  deleteCycle: (id: string) => void;

  addMethod: (data: Omit<Method, 'id'>) => void;
  updateMethod: (id: string, data: Partial<Method>) => void;
  deleteMethod: (id: string) => void;

  addBanca: (data: Omit<Banca, 'id' | 'createdAt'>) => void;
  updateBanca: (id: string, data: Partial<Banca>) => void;
  deleteBanca: (id: string) => void;

  remember: (list: 'teams' | 'comps', val: string) => void;
  removeRegistryItem: (list: 'teams' | 'comps', val: string) => void;

  importDb: (incoming: Db) => void;
  /** Cria várias operações de uma vez (importação de extrato) e marca os Market Ids como já importados. */
  importStatementBets: (entries: Array<Omit<Op, 'id' | 'bancaId' | 'seq'>>, marketIds: string[]) => void;
}

function remember(db: Db, list: 'teams' | 'comps', val: string) {
  if (!val) return;
  const arr = db[list];
  if (!arr.some((x) => x.toLowerCase() === val.toLowerCase())) {
    arr.push(val);
    arr.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }
}

export const useDbStore = create<DbState>((set, get) => ({
  db: demoData(),
  mode: 'demo',
  cloudPush: null,

  setCloudPush: (fn) => set({ cloudPush: fn }),

  loadDb: (db, mode) => set({ db, mode }),
  applyRemote: (db) => set({ db, mode: 'cloud' }),

  setUnit: (u) => {
    const db = get().db;
    db.settings = { ...db.settings, unit: u };
    commit(set, get, db);
  },

  setActiveBanca: (id) => {
    const db = get().db;
    db.activeBanca = id;
    commit(set, get, db);
  },

  addOp: (data, cycleId) => {
    const db = get().db;
    const op: Op = { ...data, id: uid(), bancaId: db.activeBanca!, cycleId: cycleId ?? null, seq: Date.now() };
    db.ops = [...db.ops, op];
    remember(db, 'teams', op.teamA);
    remember(db, 'teams', op.teamB);
    remember(db, 'comps', op.comp);
    commit(set, get, db);
  },
  updateOp: (id, data) => {
    const db = get().db;
    db.ops = db.ops.map((o) => (o.id === id ? { ...o, ...data } : o));
    if (data.teamA) remember(db, 'teams', data.teamA);
    if (data.teamB) remember(db, 'teams', data.teamB);
    if (data.comp) remember(db, 'comps', data.comp);
    commit(set, get, db);
  },
  deleteOp: (id) => {
    const db = get().db;
    db.ops = db.ops.filter((o) => o.id !== id);
    commit(set, get, db);
  },

  addCycle: (data) => {
    const db = get().db;
    const c: Cycle = { id: uid(), bancaId: db.activeBanca!, createdAt: Date.now(), ...data };
    db.cycles = [...db.cycles, c];
    commit(set, get, db);
    return c.id;
  },
  updateCycle: (id, data) => {
    const db = get().db;
    db.cycles = db.cycles.map((c) => (c.id === id ? { ...c, ...data } : c));
    commit(set, get, db);
  },
  deleteCycle: (id) => {
    const db = get().db;
    db.ops = db.ops.map((o) => (o.cycleId === id ? { ...o, cycleId: null } : o));
    db.cycles = db.cycles.filter((c) => c.id !== id);
    commit(set, get, db);
  },

  addMethod: (data) => {
    const db = get().db;
    db.methods = [...db.methods, { id: uid(), ...data }];
    commit(set, get, db);
  },
  updateMethod: (id, data) => {
    const db = get().db;
    db.methods = db.methods.map((m) => (m.id === id ? { ...m, ...data } : m));
    commit(set, get, db);
  },
  deleteMethod: (id) => {
    const db = get().db;
    db.methods = db.methods.filter((m) => m.id !== id);
    db.ops = db.ops.map((o) => (o.methodId === id ? { ...o, methodId: null } : o));
    db.cycles = db.cycles.map((c) => (c.methodId === id ? { ...c, methodId: null } : c));
    commit(set, get, db);
  },

  addBanca: (data) => {
    const db = get().db;
    const nb: Banca = { id: uid(), createdAt: Date.now(), ...data };
    db.bancas = [...db.bancas, nb];
    db.activeBanca = nb.id;
    commit(set, get, db);
  },
  updateBanca: (id, data) => {
    const db = get().db;
    db.bancas = db.bancas.map((b) => (b.id === id ? { ...b, ...data } : b));
    commit(set, get, db);
  },
  deleteBanca: (id) => {
    const db = get().db;
    db.bancas = db.bancas.filter((b) => b.id !== id);
    db.ops = db.ops.filter((o) => o.bancaId !== id);
    db.cycles = db.cycles.filter((c) => c.bancaId !== id);
    if (db.activeBanca === id) db.activeBanca = db.bancas[0]?.id ?? null;
    commit(set, get, db);
  },

  remember: (list, val) => {
    const db = get().db;
    remember(db, list, val);
    commit(set, get, db);
  },
  removeRegistryItem: (list, val) => {
    const db = get().db;
    db[list] = db[list].filter((x) => x !== val);
    commit(set, get, db);
  },

  importDb: (incoming) => {
    const db: Db = Object.assign(BLANK(), incoming);
    if (!db.bancas.length) {
      db.bancas = freshAccount().bancas;
      db.activeBanca = db.bancas[0].id;
    }
    if (!db.activeBanca) db.activeBanca = db.bancas[0].id;
    commit(set, get, db);
  },

  importStatementBets: (entries, marketIds) => {
    const db = get().db;
    const newOps = entries.map((data, idx) => {
      const op: Op = { ...data, id: uid(), bancaId: db.activeBanca!, seq: Date.now() + idx };
      remember(db, 'teams', op.teamA);
      remember(db, 'teams', op.teamB);
      remember(db, 'comps', op.comp);
      return op;
    });
    db.ops = [...db.ops, ...newOps];
    const merged = new Set(db.importedMarketIds);
    marketIds.forEach((id) => merged.add(id));
    db.importedMarketIds = [...merged];
    commit(set, get, db);
  },
}));

/** Clona o db (nova referência) e persiste na nuvem quando logado. Nada é salvo no navegador. */
function commit(set: (partial: Partial<DbState>) => void, get: () => DbState, db: Db) {
  const next = { ...db };
  set({ db: next });
  const { mode, cloudPush } = get();
  if (mode === 'cloud') cloudPush?.();
  // mode === 'demo': nunca grava em lugar nenhum — é só a sessão de visitante
}
