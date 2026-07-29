import type { Db } from './types';
import { BLANK } from './storage';

/** Dados fictícios mostrados a visitantes (modo demonstração, somente leitura). */
export function demoData(): Db {
  let s = 7;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const d = BLANK();
  const b = { id: 'demo-b', name: 'Banca demonstração', initial: 1000, stake: 25, createdAt: Date.now() };
  d.bancas = [b];
  d.activeBanca = b.id;
  d.methods = [
    { id: 'dm1', name: 'Lay 0x0 até 60’', definition: 'Entrada em jogos com média alta de gols, saída no 60º minuto ou no primeiro gol.', stakeType: 'fixo', stakeValue: 50, tolerance: 5 },
    { id: 'dm2', name: 'Over 0.5 HT', definition: 'Favorito jogando em casa, entrada antes do intervalo.', stakeType: 'pct', stakeValue: 3, tolerance: 10 },
    { id: 'dm3', name: 'Cash out escalonado', definition: 'Saída parcial em 50% do alvo, restante no fim do jogo.', stakeType: 'un', stakeValue: 2, tolerance: 10 },
  ];
  const times = ['Bahia', 'Vitória', 'Flamengo', 'Palmeiras', 'Grêmio', 'Internacional', 'Fortaleza', 'Ceará', 'Athletico', 'Cruzeiro', 'Santos', 'Corinthians'];
  const comps = ['Brasileirão Série A', 'Copa do Nordeste', 'Copa do Brasil', 'Libertadores'];
  d.teams = [...times].sort((a, b2) => a.localeCompare(b2, 'pt-BR'));
  d.comps = [...comps];
  const hoje = new Date();
  let seq = 1;
  for (let i = 44; i >= 0; i--) {
    const day = new Date(hoje);
    day.setDate(day.getDate() - Math.floor(i * 1.6));
    const date = new Date(day.getTime() - day.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    const m = d.methods[Math.floor(rnd() * 3)];
    const stakeBase = m.stakeType === 'fixo' ? 50 : m.stakeType === 'pct' ? 32 : 50;
    const solto = rnd() < 0.18;
    const stake = solto ? Math.round(stakeBase * (2 + rnd())) : stakeBase;
    const green = rnd() < 0.62;
    const a = times[Math.floor(rnd() * times.length)];
    let v = times[Math.floor(rnd() * times.length)];
    if (v === a) v = times[(times.indexOf(a) + 3) % times.length];
    d.ops.push({
      id: 'd' + i, bancaId: b.id, cycleId: null, date, teamA: a, teamB: v, comp: comps[Math.floor(rnd() * comps.length)],
      methodId: m.id, market: green ? 'entrada no plano' : 'entrada tardia', stake, odd: 0, result: green ? 'green' : 'red',
      pnl: green ? Math.round(stake * (0.35 + rnd() * 0.5)) : -Math.round(stake * (0.6 + rnd() * 0.4)),
      note: solto ? 'Entrei com stake acima do método para tentar recuperar.' : '', seq: seq++,
    });
  }
  const c = { id: 'demo-c', bancaId: b.id, name: 'Ciclo demonstração', methodId: 'dm1', initial: 500, count: 3, pct: 5,
    reduction: 2.5, minPct: 0, withdrawPct: 50, resetPct: true, createdAt: Date.now() };
  d.cycles = [c];
  let bank = 500;
  for (let i = 0; i < 12; i++) {
    const pct = 5 * Math.pow(0.975, i);
    const lucro = Math.round(bank * pct / 100 * 100) / 100;
    const day = new Date(hoje);
    day.setDate(day.getDate() - (12 - i));
    d.ops.push({
      id: 'dc' + i, bancaId: b.id, cycleId: c.id,
      date: new Date(day.getTime() - day.getTimezoneOffset() * 6e4).toISOString().slice(0, 10),
      teamA: times[i % times.length], teamB: times[(i + 5) % times.length], comp: comps[i % comps.length], methodId: 'dm1',
      market: 'lay 0x0', stake: 50, odd: 0, result: 'green', pnl: lucro, note: '', seq: seq++,
    });
    bank += lucro;
  }
  return d;
}
