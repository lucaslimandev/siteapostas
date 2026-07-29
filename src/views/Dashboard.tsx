import { useMemo } from 'react';
import { useBancaData } from '../hooks/useBancaData';
import { useUiStore } from '../hooks/useUiStore';
import { useOpDialogStore, useDetailDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { buckets, bucketOf, groupBy, labelOf, methodName, summarize } from '../lib/engine';
import { cls, fmtDate, fmtV, money, pctS, un } from '../lib/format';
import { SERIES } from '../lib/canvas';
import Stat from '../components/common/Stat';
import RankList from '../components/common/RankList';
import ResultChip from '../components/common/ResultChip';
import SeriesChart from '../components/charts/SeriesChart';
import MultiLineChart from '../components/charts/MultiLineChart';
import type { Period } from '../lib/types';

const DASH_PERIODS: { p: Period; label: string }[] = [
  { p: 'day', label: 'Dia' },
  { p: 'week', label: 'Semana' },
  { p: 'month', label: 'Mês' },
  { p: 'year', label: 'Ano' },
];
const DASH_SERIES: { s: 'both' | 'bars' | 'line'; label: string }[] = [
  { s: 'both', label: 'Barras + linha' },
  { s: 'bars', label: 'Só barras' },
  { s: 'line', label: 'Só linha' },
];

export default function Dashboard() {
  const { db, banca, unit, enriched } = useBancaData();
  const dashPeriod = useUiStore((s) => s.dashPeriod);
  const dashSeries = useUiStore((s) => s.dashSeries);
  const setDashPeriod = useUiStore((s) => s.setDashPeriod);
  const setDashSeries = useUiStore((s) => s.setDashSeries);
  const showView = useUiStore((s) => s.showView);
  const openOpDialog = useOpDialogStore((s) => s.openOpDialog);
  const openDetail = useDetailDialogStore((s) => s.openDetail);
  const cloud = useCloud();

  const s = useMemo(() => summarize(enriched, banca), [enriched, banca]);
  const bks = useMemo(() => buckets(enriched, dashPeriod), [enriched, dashPeriod]);

  const methodSeries = useMemo(() => {
    const bkKeys = bks.map((x) => x.key);
    const used = [...new Set(enriched.map((o) => o.methodId || '__none'))];
    return used
      .slice(0, 8)
      .map((mid, i) => {
        const ops = enriched.filter((o) => (o.methodId || '__none') === mid);
        let cum = 0;
        const map = new Map<string, number>();
        ops.forEach((o) => map.set(bucketOf(o.date, dashPeriod), (map.get(bucketOf(o.date, dashPeriod)) || 0) + o.pnl));
        const points = bkKeys.map((k) => {
          cum += map.get(k) || 0;
          return cum;
        });
        return { name: mid === '__none' ? 'Sem método' : methodName(db.methods, mid), color: SERIES[i % SERIES.length], points, total: cum };
      })
      .sort((a, b) => b.total - a.total);
  }, [enriched, bks, dashPeriod, db.methods]);

  const offs = enriched.filter((o) => o.off);
  const diff = s.adj - s.pnl;

  const methodRank = useMemo(
    () =>
      groupBy(enriched, (o) => [o.methodId || '__none'], banca)
        .sort((a, b) => b.pnl - a.pnl)
        .map((m) => ({ label: m.key === '__none' ? 'Sem método' : methodName(db.methods, m.key), sub: `${m.n} ops · ${pctS(m.hit, 0)} acerto`, value: m.pnl })),
    [enriched, banca, db.methods]
  );

  const teamRank = useMemo(() => {
    const teams = groupBy(enriched, (o) => [o.teamA, o.teamB], banca).sort((a, b) => b.pnl - a.pnl);
    const top = [...teams.slice(0, 4), ...teams.slice(-3).filter((t) => t.pnl < 0)];
    const seen = new Set<string>();
    return top.filter((t) => !seen.has(t.key) && seen.add(t.key)).map((t) => ({ label: t.key, sub: `${t.n} ops`, value: t.pnl }));
  }, [enriched, banca]);

  const last = enriched.slice(-6).reverse();

  if (!banca) return null;

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Painel</span>
          <h1>{banca.name}</h1>
          <p>
            Inicial {money(banca.initial)} · 1 unidade = {money(banca.stake)} · {enriched.length} operações registradas
          </p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => gate(cloud.locked, () => openOpDialog(null, null))}>
          + Nova operação
        </button>
      </div>

      <div className="stats">
        <Stat label="Banca atual" value={money(banca.initial + s.pnl)} sub={`inicial ${money(banca.initial)}`} />
        <Stat label="Resultado" value={fmtV(s.pnl, banca, unit)} valueClass={cls(s.pnl)} sub={`${pctS(banca.initial ? (s.pnl / banca.initial) * 100 : 0)} da banca`} />
        <Stat label="Unidades" value={(s.units > 0 ? '+' : '') + un(s.units)} valueClass={cls(s.units)} sub={`1u = ${money(banca.stake)}`} />
        <Stat label="ROI" value={s.roi == null ? '—' : pctS(s.roi)} valueClass={cls(s.roi || 0)} sub={`stake ${money(s.stake)}`} />
        <Stat label="Acerto" value={pctS(s.hit, 1)} sub={`${s.greens}G · ${s.reds}R`} />
        <Stat label="Drawdown máx." value={s.dd ? fmtV(s.dd, banca, unit, { sign: false }) : '—'} valueClass={s.dd < 0 ? 'neg' : ''} sub="pico até fundo" />
      </div>

      <div className="grid two-col">
        <div className="grid" style={{ gap: 14 }}>
          <div className="card">
            <div className="section-title">
              <h3>Evolução</h3>
              <div className="chart-tools">
                <div className="mini-toggle">
                  {DASH_PERIODS.map((x) => (
                    <button key={x.p} className={dashPeriod === x.p ? 'on' : ''} onClick={() => setDashPeriod(x.p)}>
                      {x.label}
                    </button>
                  ))}
                </div>
                <div className="mini-toggle">
                  {DASH_SERIES.map((x) => (
                    <button key={x.s} className={dashSeries === x.s ? 'on' : ''} onClick={() => setDashSeries(x.s)}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <SeriesChart buckets={bks} mode={dashSeries} banca={banca} unit={unit} />
          </div>

          <div className="card">
            <div className="section-title">
              <h3>Comparativo de métodos</h3>
              <span className="chip">acumulado</span>
            </div>
            <MultiLineChart labels={bks.map((k) => labelOf(k.key, dashPeriod))} series={methodSeries} banca={banca} unit={unit} small />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 12 }}>
              {methodSeries.map((s2) => (
                <span key={s2.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i style={{ width: 14, height: 3, borderRadius: 2, background: s2.color, display: 'inline-block' }} />
                  {s2.name} <b className={'mono ' + cls(s2.total)}>{fmtV(s2.total, banca, unit)}</b>
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <h3>Últimas operações</h3>
              <button className="btn ghost sm" onClick={() => showView('ops')}>
                Ver todas
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <tbody>
                  {last.length ? (
                    last.map((o) => (
                      <tr className="clickable" key={o.id} onClick={() => openDetail(o.id)}>
                        <td className="l mono" data-label="Data" style={{ width: 70 }}>
                          {fmtDate(o.date)}
                        </td>
                        <td className="l" data-label="Jogo">
                          {o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : <span className="dim">sem jogo</span>}
                          <span className="comp">
                            {o.comp} {o.cycleId ? '· ciclo' : ''}
                          </span>
                        </td>
                        <td className="l dim" data-label="Método" style={{ fontSize: 12 }}>
                          {methodName(db.methods, o.methodId)}
                        </td>
                        <td data-label="Resultado">
                          <ResultChip result={o.result} pnl={o.pnl} banca={banca} unit={unit} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="l dim" style={{ padding: '18px 0' }}>
                        Nenhuma operação ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gap: 14 }}>
          <div className="card">
            <div className="section-title">
              <h3>Disciplina</h3>
              <span className="chip">{offs.length} fora do método</span>
            </div>
            {offs.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="dim">Resultado real</span>
                  <b className={'mono ' + cls(s.pnl)}>{fmtV(s.pnl, banca, unit)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="dim">Seguindo a stake do método</span>
                  <b className={'mono ' + cls(s.adj)}>{fmtV(s.adj, banca, unit)}</b>
                </div>
                <div className="bar">
                  <i style={{ width: Math.min(100, (Math.abs(s.pnl) / (Math.max(Math.abs(s.pnl), Math.abs(s.adj)) || 1)) * 100) + '%' }} />
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                  {diff > 0 ? (
                    <>
                      Sair do método <b className="neg">custou {fmtV(-Math.abs(diff), banca, unit, { sign: false })}</b> até aqui.
                    </>
                  ) : diff < 0 ? (
                    <>
                      Sair do método <b className="pos">rendeu {fmtV(Math.abs(diff), banca, unit, { sign: false })}</b> a mais — mas com risco fora do plano.
                    </>
                  ) : (
                    'Sem diferença material até aqui.'
                  )}
                </div>
              </div>
            ) : (
              <p className="dim" style={{ margin: 0, fontSize: 13 }}>
                Toda operação com método respeitou a stake definida. Defina a stake de cada método para acompanhar isso.
              </p>
            )}
          </div>
          <div className="card">
            <div className="section-title">
              <h3>Top métodos</h3>
            </div>
            <RankList items={methodRank} banca={banca} unit={unit} />
          </div>
          <div className="card">
            <div className="section-title">
              <h3>Times</h3>
              <span className="chip">melhores e piores</span>
            </div>
            <RankList items={teamRank} banca={banca} unit={unit} />
          </div>
        </div>
      </div>
    </section>
  );
}
