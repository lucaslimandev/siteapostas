import { useMemo } from 'react';
import { useBancaData } from '../hooks/useBancaData';
import { useUiStore } from '../hooks/useUiStore';
import { useDetailDialogStore } from '../hooks/useDialogs';
import { groupBy, inPeriod, methodName, summarize } from '../lib/engine';
import { cls, fmtDate, fmtV, money, pctS, un } from '../lib/format';
import ResultChip from '../components/common/ResultChip';
import BarChart from '../components/charts/BarChart';
import Stat from '../components/common/Stat';

const PERIODS = [
  { p: 'all', label: 'Tudo' },
  { p: '30', label: '30d' },
  { p: '90', label: '90d' },
  { p: 'year', label: 'Ano' },
];

export default function Reports() {
  const { db, banca, unit, enriched } = useBancaData();
  const repPeriod = useUiStore((s) => s.repPeriod);
  const setRepPeriod = useUiStore((s) => s.setRepPeriod);
  const openDetail = useDetailDialogStore((s) => s.openDetail);

  const list = useMemo(() => inPeriod(enriched, repPeriod), [enriched, repPeriod]);
  const s = useMemo(() => summarize(list, banca), [list, banca]);
  const offs = list.filter((o) => o.off);
  const diff = s.adj - s.pnl;

  const methods = useMemo(() => groupBy(list, (o) => [o.methodId || '__none'], banca).sort((a, b) => b.pnl - a.pnl), [list, banca]);
  const comps = useMemo(() => groupBy(list, (o) => [o.comp || '(sem competição)'], banca).sort((a, b) => b.pnl - a.pnl), [list, banca]);
  const teams = useMemo(() => groupBy(list, (o) => [o.teamA, o.teamB], banca).sort((a, b) => b.pnl - a.pnl), [list, banca]);

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Análise</span>
          <h1>Relatórios</h1>
          <p>O que dá lucro, o que dá prejuízo e quanto a indisciplina custou.</p>
        </div>
        <div className="mini-toggle" style={{ marginLeft: 'auto' }}>
          {PERIODS.map((x) => (
            <button key={x.p} className={repPeriod === x.p ? 'on' : ''} onClick={() => setRepPeriod(x.p)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-title">
          <h3>Se você tivesse seguido o método</h3>
          <span className="chip warn">
            {offs.length} de {s.n} operações
          </span>
        </div>
        <div className="stats" style={{ margin: 0 }}>
          <Stat label="Resultado real" value={fmtV(s.pnl, banca, unit)} valueClass={cls(s.pnl)} />
          <Stat label="Se tivesse seguido a stake" value={fmtV(s.adj, banca, unit)} valueClass={cls(s.adj)} />
          <Stat label="Diferença" value={fmtV(diff, banca, unit)} valueClass={cls(diff)} sub={diff < 0 ? 'a indisciplina custou' : 'a indisciplina rendeu'} />
          <Stat label="Stake fora do plano" value={money(offs.reduce((a, o) => a + (o.stake - o.exp), 0))} sub="acima do previsto" />
        </div>
        {offs.length ? (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th className="l">Data</th>
                  <th className="l">Jogo</th>
                  <th className="l">Método</th>
                  <th>Stake usada</th>
                  <th>Stake do método</th>
                  <th>Real</th>
                  <th>No método</th>
                </tr>
              </thead>
              <tbody>
                {offs
                  .slice()
                  .reverse()
                  .map((o) => (
                    <tr className="clickable" key={o.id} onClick={() => openDetail(o.id)}>
                      <td className="l mono" data-label="Data">{fmtDate(o.date)}</td>
                      <td className="l" data-label="Jogo">{o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : 'sem jogo'}</td>
                      <td className="l" data-label="Método" style={{ fontSize: 12 }}>
                        {methodName(db.methods, o.methodId)}
                      </td>
                      <td className="mono neg" data-label="Stake usada">{money(o.stake)}</td>
                      <td className="mono" data-label="Stake do método">{money(o.exp)}</td>
                      <td className={'mono ' + cls(o.pnl)} data-label="Real">{fmtV(o.pnl, banca, unit)}</td>
                      <td className={'mono ' + cls(o.adjPnl)} data-label="No método">{fmtV(o.adjPnl, banca, unit)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dim" style={{ margin: '12px 0 0', fontSize: 13 }}>
            Nenhuma operação acima da stake do método no período. Defina a stake em cada método para ativar esta análise.
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-title">
          <h3>Por método</h3>
          <span className="chip">ROI sobre a stake</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="l">Método</th>
                <th>Ops</th>
                <th>Acerto</th>
                <th>Stake total</th>
                <th>Resultado</th>
                <th>ROI</th>
                <th>Unidades</th>
                <th>Fora do método</th>
                <th>Se disciplinado</th>
              </tr>
            </thead>
            <tbody>
              {methods.length ? (
                methods.map((m) => {
                  const name = m.key === '__none' ? 'Sem método' : methodName(db.methods, m.key);
                  const d = m.adj - m.pnl;
                  return (
                    <tr key={m.key}>
                      <td className="l" data-label="Método">{name}</td>
                      <td className="mono" data-label="Ops">{m.n}</td>
                      <td className="mono" data-label="Acerto">{pctS(m.hit, 0)}</td>
                      <td className="mono" data-label="Stake total">{money(m.stake)}</td>
                      <td className={'mono ' + cls(m.pnl)} data-label="Resultado">{fmtV(m.pnl, banca, unit)}</td>
                      <td className={'mono ' + cls(m.roi || 0)} data-label="ROI">{m.roi == null ? '—' : pctS(m.roi, 1)}</td>
                      <td className={'mono ' + cls(m.units)} data-label="Unidades">{(m.units > 0 ? '+' : '') + un(m.units)}</td>
                      <td className={'mono ' + (m.off ? 'neg' : 'dim')} data-label="Fora do método">{m.off}</td>
                      <td className={'mono ' + cls(m.adj)} data-label="Se disciplinado">{d ? fmtV(m.adj, banca, unit) : '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="l dim" style={{ padding: '16px 0' }}>
                    Sem operações no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16 }}>
          <BarChart items={methods.map((m) => ({ label: m.key === '__none' ? 'Sem método' : methodName(db.methods, m.key), value: m.pnl }))} banca={banca} unit={unit} small />
        </div>
      </div>

      <div className="grid two-col" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="section-title">
            <h3>Por competição</h3>
          </div>
          <div className="table-wrap">
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th className="l">Competição</th>
                  <th>Ops</th>
                  <th>Acerto</th>
                  <th>Resultado</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {comps.length ? (
                  comps.map((c) => (
                    <tr key={c.key}>
                      <td className="l" data-label="Competição">{c.key}</td>
                      <td className="mono" data-label="Ops">{c.n}</td>
                      <td className="mono" data-label="Acerto">{pctS(c.hit, 0)}</td>
                      <td className={'mono ' + cls(c.pnl)} data-label="Resultado">{fmtV(c.pnl, banca, unit)}</td>
                      <td className={'mono ' + cls(c.roi || 0)} data-label="ROI">{c.roi == null ? '—' : pctS(c.roi, 1)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="l dim" style={{ padding: '16px 0' }}>
                      Sem dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>Por time</h3>
            <span className="chip">mandante + visitante</span>
          </div>
          <div className="table-wrap">
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th className="l">Time</th>
                  <th>Ops</th>
                  <th>Acerto</th>
                  <th>Resultado</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {teams.length ? (
                  teams.map((t) => (
                    <tr key={t.key}>
                      <td className="l" data-label="Time">{t.key}</td>
                      <td className="mono" data-label="Ops">{t.n}</td>
                      <td className="mono" data-label="Acerto">{pctS(t.hit, 0)}</td>
                      <td className={'mono ' + cls(t.pnl)} data-label="Resultado">{fmtV(t.pnl, banca, unit)}</td>
                      <td className={'mono ' + cls(t.roi || 0)} data-label="ROI">{t.roi == null ? '—' : pctS(t.roi, 1)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="l dim" style={{ padding: '16px 0' }}>
                      Sem dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
