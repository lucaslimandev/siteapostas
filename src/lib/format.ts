import type { Banca, Unit } from './types';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export const pctS = (v: number, d = 2) =>
  (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';

export function parseNum(s: string | number | null | undefined): number {
  if (typeof s === 'number') return s;
  let str = String(s ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!str) return 0;
  if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

export function fmtDate(s: string): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

export function dOf(s: string): Date {
  return new Date(s + 'T12:00:00');
}

export const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function fmtV(v: number, banca: Banca | undefined, unit: Unit, opts: { sign?: boolean } = {}): string {
  const s = v > 0 && opts.sign !== false ? '+' : '';
  if (unit === 'pct') return s + pctS(banca?.initial ? (v / banca.initial) * 100 : 0);
  if (unit === 'un') return s + ((banca?.stake ? v / banca.stake : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'u';
  return (v > 0 && opts.sign !== false ? '+' : '') + money(v);
}

export const cls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'dim');

export const un = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'u';
