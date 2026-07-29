import type { Banca, Bucket, Cycle, Unit } from './types';
import type { CycleResult } from './engine';

export const SERIES = ['#F5B841', '#3DDC97', '#5AA9FF', '#B48BFF', '#E8A76A', '#FF6B61', '#7DD3C0', '#F58BB8'];

export interface Colors {
  amber: string;
  mint: string;
  coral: string;
  muted: string;
  sky: string;
  violet: string;
  sand: string;
}

export function readColors(el: HTMLElement = document.documentElement): Colors {
  const s = getComputedStyle(el);
  return {
    amber: s.getPropertyValue('--amber').trim(),
    mint: s.getPropertyValue('--mint').trim(),
    coral: s.getPropertyValue('--coral').trim(),
    muted: s.getPropertyValue('--muted').trim(),
    sky: s.getPropertyValue('--sky').trim(),
    violet: s.getPropertyValue('--violet').trim(),
    sand: s.getPropertyValue('--sand').trim(),
  };
}

export function setupCanvas(cv: HTMLCanvasElement | null) {
  if (!cv) return null;
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || 600;
  const h = cv.clientHeight || 240;
  cv.width = w * dpr;
  cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

export function axisFmt(v: number, banca: Banca | undefined, unit: Unit): string {
  if (unit === 'pct') return (banca?.initial ? (v / banca.initial) * 100 : 0).toFixed(1) + '%';
  if (unit === 'un') return (banca?.stake ? v / banca.stake : 0).toFixed(1) + 'u';
  return Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);
}

export function drawSeries(cv: HTMLCanvasElement | null, bks: Bucket[], mode: 'both' | 'bars' | 'line', banca: Banca | undefined, unit: Unit) {
  const cx = setupCanvas(cv);
  if (!cx) return;
  const { ctx, w, h } = cx;
  const col = readColors();
  if (!bks.length) {
    ctx.fillStyle = col.muted;
    ctx.font = '13px Archivo,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados no período', w / 2, h / 2);
    return;
  }
  const pad = { l: 56, r: 52, t: 14, b: 30 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  const showB = mode !== 'line';
  const showL = mode !== 'bars';
  const bmax = Math.max(1, ...bks.map((b) => Math.abs(b.pnl)));
  const lmin = Math.min(0, ...bks.map((b) => b.cum));
  const lmax = Math.max(0, ...bks.map((b) => b.cum)) || 1;
  const bY = (v: number) => pad.t + H / 2 - (v / bmax) * (H / 2 - 6);
  const lspan = lmax - lmin || 1;
  const lY = (v: number) => pad.t + H - ((v - lmin) / lspan) * H;
  const n = bks.length;
  const step = W / n;
  const bw = Math.max(2, Math.min(26, step * 0.62));
  ctx.font = '10px "Roboto Mono",monospace';
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (H * g) / 4;
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    if (showL) {
      ctx.fillStyle = col.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(axisFmt(lmax - (lspan * g) / 4, banca, unit), w - pad.r + 7, y);
    }
  }
  if (showB) {
    [bmax, 0, -bmax].forEach((v) => {
      ctx.fillStyle = col.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(axisFmt(v, banca, unit), pad.l - 8, bY(v));
    });
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.beginPath();
    ctx.moveTo(pad.l, bY(0));
    ctx.lineTo(w - pad.r, bY(0));
    ctx.stroke();
    bks.forEach((b, i) => {
      const x = pad.l + step * i + step / 2 - bw / 2;
      const y0 = bY(0);
      const y = bY(b.pnl);
      ctx.fillStyle = b.pnl >= 0 ? 'rgba(61,220,151,.55)' : 'rgba(255,107,97,.55)';
      ctx.fillRect(x, Math.min(y, y0), bw, Math.max(1.5, Math.abs(y - y0)));
    });
  }
  if (showL) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = col.amber;
    ctx.lineJoin = 'round';
    bks.forEach((b, i) => {
      const x = pad.l + step * i + step / 2;
      const y = lY(b.cum);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = col.amber;
    bks.forEach((b, i) => {
      if (n > 60 && i % Math.ceil(n / 60)) return;
      const x = pad.l + step * i + step / 2;
      const y = lY(b.cum);
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, 7);
      ctx.fill();
    });
  }
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.ceil(n / Math.max(2, Math.floor(W / 62)));
  bks.forEach((b, i) => {
    if (i % every) return;
    ctx.fillText(b.label, pad.l + step * i + step / 2, pad.t + H + 8);
  });
}

export interface NamedSeries {
  name: string;
  color: string;
  points: number[];
  total: number;
}

export function drawMulti(cv: HTMLCanvasElement | null, labels: string[], series: NamedSeries[], banca: Banca | undefined, unit: Unit) {
  const cx = setupCanvas(cv);
  if (!cx) return;
  const { ctx, w, h } = cx;
  const col = readColors();
  if (!series.length || !labels.length) {
    ctx.fillStyle = col.muted;
    ctx.font = '13px Archivo,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cadastre métodos nas operações para comparar', w / 2, h / 2);
    return;
  }
  const pad = { l: 56, r: 14, t: 14, b: 28 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  const all = series.flatMap((s) => s.points);
  const mn = Math.min(0, ...all);
  const mx = Math.max(0, ...all) || 1;
  const span = mx - mn || 1;
  const X = (i: number) => pad.l + (labels.length < 2 ? W / 2 : (W * i) / (labels.length - 1));
  const Y = (v: number) => pad.t + H - ((v - mn) / span) * H;
  ctx.font = '10px "Roboto Mono",monospace';
  for (let g = 0; g <= 4; g++) {
    const v = mx - (span * g) / 4;
    const y = Y(v);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(axisFmt(v, banca, unit), pad.l - 8, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.beginPath();
  ctx.moveTo(pad.l, Y(0));
  ctx.lineTo(w - pad.r, Y(0));
  ctx.stroke();
  series.forEach((s) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = s.color;
    ctx.lineJoin = 'round';
    s.points.forEach((v, i) => {
      const x = X(i);
      const y = Y(v);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  });
  ctx.fillStyle = col.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.ceil(labels.length / Math.max(2, Math.floor(W / 62)));
  labels.forEach((l, i) => {
    if (i % every) return;
    ctx.fillText(l, X(i), pad.t + H + 8);
  });
}

export interface BarItem {
  label: string;
  value: number;
}

export function drawBars(cv: HTMLCanvasElement | null, items: BarItem[], banca: Banca | undefined, unit: Unit) {
  const cx = setupCanvas(cv);
  if (!cx) return;
  const { ctx, w, h } = cx;
  const col = readColors();
  if (!items.length) {
    ctx.fillStyle = col.muted;
    ctx.font = '13px Archivo,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', w / 2, h / 2);
    return;
  }
  const pad = { l: 56, r: 14, t: 14, b: 42 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  const mx = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  const Y = (v: number) => pad.t + H / 2 - (v / mx) * (H / 2 - 8);
  const step = W / items.length;
  const bw = Math.min(58, step * 0.6);
  ctx.font = '10px "Roboto Mono",monospace';
  [mx, 0, -mx].forEach((v) => {
    const y = Y(v);
    ctx.strokeStyle = v === 0 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(axisFmt(v, banca, unit), pad.l - 8, y);
  });
  items.forEach((it, i) => {
    const x = pad.l + step * i + step / 2;
    const y0 = Y(0);
    const y = Y(it.value);
    ctx.fillStyle = it.value >= 0 ? 'rgba(61,220,151,.6)' : 'rgba(255,107,97,.6)';
    ctx.fillRect(x - bw / 2, Math.min(y, y0), bw, Math.max(2, Math.abs(y - y0)));
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Archivo,sans-serif';
    const lbl = it.label.length > 14 ? it.label.slice(0, 13) + '…' : it.label;
    ctx.fillText(lbl, x, pad.t + H + 8);
    ctx.font = '10px "Roboto Mono",monospace';
    ctx.fillStyle = it.value >= 0 ? col.mint : col.coral;
    ctx.textBaseline = 'bottom';
    ctx.fillText(axisFmt(it.value, banca, unit), x, Math.min(y, y0) - 4);
  });
}

export function drawCycleChart(cv: HTMLCanvasElement | null, c: Cycle, r: CycleResult) {
  const cx = setupCanvas(cv);
  if (!cx) return;
  const { ctx, w, h } = cx;
  const col = readColors();
  const valid = r.rows.filter((x) => !x.orphan);
  const bank = [c.initial, ...valid.map((x) => x.bankAfterEvent!)];
  const tot = [c.initial, ...valid.map((x) => x.bankAfterEvent! + x.cumWithdrawn!)];
  if (bank.length < 2) {
    ctx.fillStyle = col.muted;
    ctx.font = '13px Archivo,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Registre entradas para ver a evolução', w / 2, h / 2);
    return;
  }
  const pad = { l: 60, r: 14, t: 16, b: 28 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  const all = [...bank, ...tot, c.initial * 2];
  let mn = Math.min(...all);
  let mx = Math.max(...all);
  const sp = mx - mn || 1;
  mn = Math.max(0, mn - sp * 0.12);
  mx += sp * 0.12;
  const X = (i: number) => pad.l + (W * i) / (bank.length - 1);
  const Y = (v: number) => pad.t + H - H * ((v - mn) / (mx - mn || 1));
  ctx.font = '11px "Roboto Mono",monospace';
  for (let g = 0; g <= 4; g++) {
    const v = mn + ((mx - mn) * g) / 4;
    const y = Y(v);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = col.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0), pad.l - 8, y);
  }
  valid.forEach((row, i) => {
    if (!row.closes) return;
    const x = X(i + 1);
    ctx.strokeStyle = 'rgba(61,220,151,.35)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, pad.t + H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col.mint;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '600 10px "Barlow Condensed",sans-serif';
    ctx.fillText('C' + row.sub, x, pad.t + 2);
    ctx.font = '11px "Roboto Mono",monospace';
  });
  ctx.beginPath();
  ctx.moveTo(X(0), pad.t + H);
  bank.forEach((v, i) => ctx.lineTo(X(i), Y(v)));
  ctx.lineTo(X(bank.length - 1), pad.t + H);
  ctx.closePath();
  ctx.fillStyle = 'rgba(245,184,65,.10)';
  ctx.fill();
  const line = (s: number[], color: string) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    s.forEach((v, i) => {
      i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v));
    });
    ctx.stroke();
  };
  line(tot, col.mint);
  line(bank, col.amber);
  valid.forEach((row, i) => {
    ctx.beginPath();
    ctx.arc(X(i + 1), Y(row.bankAfterEvent!), 3, 0, 7);
    ctx.fillStyle = row.entry.result === 'green' ? col.mint : row.entry.result === 'red' ? col.coral : col.muted;
    ctx.fill();
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '11px "Roboto Mono",monospace';
  let lx = pad.l + 4;
  ([['Banca do ciclo', col.amber], ['Com saques', col.mint]] as const).forEach(([t, cc]) => {
    ctx.fillStyle = cc;
    ctx.fillRect(lx, pad.t + H + 12, 12, 2);
    ctx.fillStyle = col.muted;
    ctx.fillText(t, lx + 18, pad.t + H + 13);
    lx += ctx.measureText(t).width + 42;
  });
}
