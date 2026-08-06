export type Result = 'green' | 'red' | 'void';
export type StakeType = 'fixo' | 'pct' | 'un';
export type Unit = 'money' | 'pct' | 'un';

export interface Banca {
  id: string;
  name: string;
  initial: number;
  stake: number;
  createdAt: number;
}

export interface Method {
  id: string;
  name: string;
  definition: string;
  stakeType: StakeType;
  stakeValue: number;
  tolerance: number;
}

export interface Op {
  id: string;
  bancaId: string;
  cycleId: string | null;
  date: string;
  teamA: string;
  teamB: string;
  comp: string;
  methodId: string | null;
  market: string;
  stake: number;
  odd: number;
  result: Result;
  pnl: number;
  note: string;
  seq: number;
  /** Market Id do extrato, quando a operação veio de uma importação — evita duplicar no futuro. */
  sourceMarketId?: string;
}

export interface Cycle {
  id: string;
  bancaId: string;
  name: string;
  methodId: string | null;
  initial: number;
  count: number;
  pct: number;
  reduction: number;
  minPct: number;
  withdrawPct: number;
  resetPct: boolean;
  createdAt: number;
}

export interface Settings {
  unit: Unit;
}

export interface Db {
  v: 2;
  bancas: Banca[];
  activeBanca: string | null;
  methods: Method[];
  ops: Op[];
  cycles: Cycle[];
  teams: string[];
  comps: string[];
  settings: Settings;
  /** Market Ids de extratos já importados — impede reimportar a mesma aposta. */
  importedMarketIds: string[];
}

/** Operação com campos derivados pelo motor de cálculo (enrich). */
export interface EnrichedOp extends Op {
  m: Method | null;
  exp: number;
  off: boolean;
  adjPnl: number;
  before: number;
  after: number;
  dafter: number;
  roi: number | null;
}

export interface Summary {
  n: number;
  pnl: number;
  stake: number;
  adj: number;
  greens: number;
  reds: number;
  hit: number;
  roi: number | null;
  units: number;
  dd: number;
  off: number;
}

export interface Bucket {
  key: string;
  label: string;
  pnl: number;
  cum: number;
}

export type Period = 'day' | 'week' | 'month' | 'year';
