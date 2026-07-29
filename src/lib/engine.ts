import type { Banca, Bucket, Cycle, Db, EnrichedOp, Method, Op, Period, Summary } from './types';
import { dOf } from './format';
import { MES } from './format';

/* ============================================================
   OPERAÇÕES ENRIQUECIDAS
   ============================================================ */
export function expectedStake(m: Method | null | undefined, b: Banca, bank: number): number {
  if (!m || !(Number(m.stakeValue) > 0)) return 0;
  if (m.stakeType === 'pct') return (bank * m.stakeValue) / 100;
  if (m.stakeType === 'un') return m.stakeValue * (b.stake || 0);
  return m.stakeValue;
}

export function sortOps<T extends { date: string; seq?: number }>(list: T[]): T[] {
  return list.slice().sort((a, b) => (a.date === b.date ? (a.seq || 0) - (b.seq || 0) : a.date < b.date ? -1 : 1));
}

/**
 * Operações de um ciclo não usam a stake do método como referência de disciplina —
 * usam o alvo (lucro esperado) calculado pelo próprio ciclo para aquela entrada.
 */
function cycleTargetsByOpId(ops: Op[], banca: Banca, cycles: Cycle[]): Map<string, number> {
  const map = new Map<string, number>();
  cycles.filter((c) => c.bancaId === banca.id).forEach((c) => {
    const r = computeCycle(c, ops);
    r.rows.forEach((row) => {
      if (!row.orphan && row.target != null) map.set(row.entry.id, row.target);
    });
  });
  return map;
}

export function enrich(ops: Op[], banca: Banca | undefined, methods: Method[], cycles: Cycle[]): EnrichedOp[] {
  if (!banca) return [];
  const list = sortOps(ops.filter((o) => o.bancaId === banca.id));
  const cycleTargets = cycleTargetsByOpId(ops, banca, cycles);
  let bank = banca.initial;
  let dbank = banca.initial;
  return list.map((o) => {
    const m = methods.find((x) => x.id === o.methodId) || null;
    const cycleExp = o.cycleId ? cycleTargets.get(o.id) : undefined;
    const exp = cycleExp != null ? cycleExp : expectedStake(m, banca, bank);
    const stake = Number(o.stake) || 0;
    const tol = cycleExp != null ? (m ? Number(m.tolerance) || 0 : 5) : m ? Number(m.tolerance) || 0 : 0;
    const off = !!(exp > 0 && stake > 0 && stake > exp * (1 + tol / 100));
    const adjPnl = off ? o.pnl * (exp / stake) : o.pnl;
    const before = bank;
    bank += o.pnl;
    dbank += adjPnl;
    return {
      ...o,
      m,
      exp,
      off,
      adjPnl,
      before,
      after: bank,
      dafter: dbank,
      roi: stake > 0 ? (o.pnl / stake) * 100 : null,
    };
  });
}

export function inPeriod<T extends { date: string }>(list: T[], p: string): T[] {
  if (p === 'all' || !p) return list;
  const now = new Date();
  let from: Date;
  if (p === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (p === 'year') from = new Date(now.getFullYear(), 0, 1);
  else {
    from = new Date();
    from.setDate(from.getDate() - parseInt(p, 10));
  }
  const f = new Date(from.getTime() - from.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  return list.filter((o) => o.date >= f);
}

export function summarize(list: EnrichedOp[], banca: Banca | undefined): Summary {
  const pnl = list.reduce((s, o) => s + o.pnl, 0);
  const stake = list.reduce((s, o) => s + (Number(o.stake) || 0), 0);
  const adj = list.reduce((s, o) => s + (o.adjPnl ?? o.pnl), 0);
  const g = list.filter((o) => o.result === 'green').length;
  const r = list.filter((o) => o.result === 'red').length;
  let peak = -Infinity;
  let dd = 0;
  let run = banca ? banca.initial : 0;
  list.forEach((o) => {
    run += o.pnl;
    peak = Math.max(peak, run);
    dd = Math.min(dd, run - peak);
  });
  return {
    n: list.length,
    pnl,
    stake,
    adj,
    greens: g,
    reds: r,
    hit: g + r ? (g / (g + r)) * 100 : 0,
    roi: stake ? (pnl / stake) * 100 : null,
    units: banca && banca.stake ? pnl / banca.stake : 0,
    dd,
    off: list.filter((o) => o.off).length,
  };
}

/* ============================================================
   AGRUPAMENTOS
   ============================================================ */
export function bucketOf(date: string, p: Period): string {
  if (p === 'day') return date;
  if (p === 'month') return date.slice(0, 7);
  if (p === 'year') return date.slice(0, 4);
  const d = dOf(date);
  const off = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - off);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

export function labelOf(key: string, p: Period): string {
  if (p === 'year') return key;
  if (p === 'month') {
    const [y, m] = key.split('-');
    return MES[+m - 1] + '/' + y.slice(2);
  }
  const [, m, d] = key.split('-');
  return d + '/' + m;
}

export function buckets(list: EnrichedOp[], p: Period): Bucket[] {
  const map = new Map<string, number>();
  list.forEach((o) => {
    const k = bucketOf(o.date, p);
    map.set(k, (map.get(k) || 0) + o.pnl);
  });
  const keys = [...map.keys()].sort();
  let cum = 0;
  return keys.map((k) => {
    const pnl = map.get(k)!;
    cum += pnl;
    return { key: k, label: labelOf(k, p), pnl, cum };
  });
}

export interface Grouped extends Summary {
  key: string;
  ops: EnrichedOp[];
}

export function groupBy(list: EnrichedOp[], keyFn: (o: EnrichedOp) => (string | null | undefined)[], banca: Banca | undefined): Grouped[] {
  const map = new Map<string, EnrichedOp[]>();
  list.forEach((o) => {
    keyFn(o).forEach((k) => {
      if (!k) return;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    });
  });
  return [...map.entries()].map(([k, v]) => ({ key: k, ops: v, ...summarize(v, banca) }));
}

/* ============================================================
   MOTOR: CICLOS
   ============================================================ */
export function cycleOps(ops: Op[], cycleId: string): Op[] {
  return sortOps(ops.filter((o) => o.cycleId === cycleId));
}

/**
 * % desta entrada: reduz geometricamente a partir da base do ciclo interno atual,
 * contando só as entradas já feitas NESTE ciclo interno (nunca acumula sobre todo o histórico).
 * "Reiniciar a %" decide apenas se a base volta a ser c.pct a cada novo ciclo interno,
 * ou se carrega o valor onde o ciclo anterior parou.
 */
export function pctFor(basePct: number, reduction: number, minPct: number, local: number): number {
  return Math.max(basePct * Math.pow(1 - (reduction || 0) / 100, local), minPct || 0);
}

export interface CycleRow {
  entry: Op;
  orphan?: boolean;
  sub?: number;
  n?: number;
  pct?: number;
  before?: number;
  target?: number;
  profit?: number;
  after?: number;
  closes?: boolean;
  take?: number;
  bankAfterEvent?: number;
  cumWithdrawn?: number;
  /** % realmente ganha ou perdida nesta entrada (lucro / banca antes) */
  pctActual?: number;
  /** diferença entre o % realizado e o % alvo desta entrada */
  pctDiff?: number;
}

export interface CycleSub {
  index: number;
  start: number;
  rows: CycleRow[];
  closed: boolean;
  end?: number;
  take?: number;
  carry?: number;
}

export interface CycleResult {
  rows: CycleRow[];
  subs: CycleSub[];
  bank: number;
  active: CycleSub | null;
  finished: boolean;
  withdrawn: number;
  idx: number;
  local: number;
  global: number;
  greens: number;
  reds: number;
  total: number;
  profit: number;
  nextPct: number;
  /** % base do ciclo interno em andamento (após reduções já aplicadas nele) — usada para simular os próximos passos */
  activeBasePct: number;
}

export function computeCycle(c: Cycle, ops: Op[]): CycleResult {
  const list = cycleOps(ops, c.id);
  const rows: CycleRow[] = [];
  const subs: CycleSub[] = [];
  let idx = 1;
  let local = 0;
  let global = 0;
  let withdrawn = 0;
  let finished = false;
  let bank = c.initial;
  let basePct = c.pct;
  let lastPct = c.pct;
  let cur: CycleSub = { index: 1, start: c.initial, rows: [], closed: false };
  let greens = 0;
  let reds = 0;
  for (const e of list) {
    if (finished) {
      rows.push({ entry: e, orphan: true });
      continue;
    }
    const pct = pctFor(basePct, c.reduction, c.minPct, local);
    const before = bank;
    const target = (before * pct) / 100;
    const profit = Number(e.pnl) || 0;
    bank = before + profit;
    if (e.result === 'green') greens++;
    else if (e.result === 'red') reds++;
    const pctActual = before > 0 ? (profit / before) * 100 : 0;
    const row: CycleRow = { entry: e, sub: idx, n: local + 1, pct, before, target, profit, after: bank, closes: false, pctActual, pctDiff: pctActual - pct };
    rows.push(row);
    cur.rows.push(row);
    lastPct = pct;
    local++;
    global++;
    if (bank >= cur.start * 2 - 1e-9 && bank > 0) {
      const isLast = idx >= c.count;
      const take = isLast ? bank : idx === 1 ? Math.min(c.initial, bank) : bank * ((c.withdrawPct ?? 50) / 100);
      cur.end = bank;
      cur.take = take;
      cur.carry = bank - take;
      cur.closed = true;
      withdrawn += take;
      subs.push(cur);
      row.closes = true;
      row.take = take;
      if (isLast) {
        finished = true;
        bank = 0;
      } else {
        idx++;
        bank = cur.carry;
        local = 0;
        basePct = c.resetPct ? c.pct : lastPct;
        cur = { index: idx, start: bank, rows: [], closed: false };
      }
    }
    row.bankAfterEvent = row.closes ? (finished ? 0 : cur.start) : bank;
    row.cumWithdrawn = withdrawn;
  }
  if (!finished) {
    cur.end = bank;
    cur.take = 0;
    cur.carry = bank;
    subs.push(cur);
  }
  const total = withdrawn + bank;
  return {
    rows,
    subs,
    bank,
    active: finished ? null : cur,
    finished,
    withdrawn,
    idx: finished ? c.count : idx,
    local,
    global,
    greens,
    reds,
    total,
    profit: total - c.initial,
    nextPct: finished ? 0 : pctFor(basePct, c.reduction, c.minPct, local),
    activeBasePct: finished ? 0 : basePct,
  };
}

export function entriesLeft(c: Cycle, r: CycleResult): number | null {
  if (!r.active || r.bank <= 0) return null;
  let b = r.bank;
  let l = r.local;
  let n = 0;
  const goal = r.active.start * 2;
  while (b < goal && n < 400) {
    b += (b * pctFor(r.activeBasePct, c.reduction, c.minPct, l)) / 100;
    l++;
    n++;
  }
  return n >= 400 ? null : n;
}

export interface SimRow {
  n: number;
  pct: number;
  before: number;
  target: number;
  after: number;
}

/** Simula as próximas entradas do ciclo atual assumindo green em cima do alvo, até fechar o ciclo. */
export function simulateRemaining(c: Cycle, r: CycleResult, cap = 60): SimRow[] {
  if (!r.active || r.bank <= 0) return [];
  const rows: SimRow[] = [];
  let bank = r.bank;
  let local = r.local;
  const goal = r.active.start * 2;
  let n = 0;
  while (bank < goal - 1e-9 && n < cap) {
    const pct = pctFor(r.activeBasePct, c.reduction, c.minPct, local);
    const before = bank;
    const target = (before * pct) / 100;
    const after = before + target;
    rows.push({ n: local + 1, pct, before, target, after });
    bank = after;
    local++;
    n++;
  }
  return rows;
}

/* ============================================================
   HELPERS DE APRESENTAÇÃO
   ============================================================ */
export function banca(db: Db): Banca | undefined {
  return db.bancas.find((b) => b.id === db.activeBanca) || db.bancas[0];
}

export function methodName(methods: Method[], id: string | null): string {
  const m = methods.find((m) => m.id === id);
  return m ? m.name : 'Sem método';
}

export function gameLabel(o: { teamA: string; teamB: string }): string {
  return o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : 'sem jogo';
}
