import { Fragment, useEffect } from 'react';
import { useDbStore } from '../hooks/useDbStore';
import { useUiStore } from '../hooks/useUiStore';
import { useOpDialogStore, useCycleDialogStore, useDetailDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { computeCycle, entriesLeft, methodName, simulateRemaining } from '../lib/engine';
import { cls, fmtDate, money, pctS } from '../lib/format';
import ResultChip from '../components/common/ResultChip';
import CycleChart from '../components/charts/CycleChart';
import Stat from '../components/common/Stat';
import { useBancaData } from '../hooks/useBancaData';

export default function CycleDetail() {
  const currentCycle = useUiStore((s) => s.currentCycle);
  const showView = useUiStore((s) => s.showView);
  const db = useDbStore((s) => s.db);
  const deleteCycle = useDbStore((s) => s.deleteCycle);
  const openOpDialog = useOpDialogStore((s) => s.openOpDialog);
  const openCycleDialog = useCycleDialogStore((s) => s.openCycleDialog);
  const openDetail = useDetailDialogStore((s) => s.openDetail);
  const cloud = useCloud();
  const { banca, unit } = useBancaData();

  const c = db.cycles.find((x) => x.id === currentCycle);

  useEffect(() => {
    if (!c) showView('cycles');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c]);

  if (!c) return null;

  const r = computeCycle(c, db.ops);
  const m = db.methods.find((x) => x.id === c.methodId);
  const hit = r.greens + r.reds ? (r.greens / (r.greens + r.reds)) * 100 : 0;
  const left = entriesLeft(c, r);
  const simRows = simulateRemaining(c, r);
  const activeProfit = r.active ? r.bank - r.active.start : 0;
  const nextTarget = r.finished ? null : (r.bank * r.nextPct) / 100;

  function handleDelete() {
    if (window.confirm(`Excluir "${c!.name}"? As operações continuam na banca, apenas desvinculadas.`)) {
      deleteCycle(c!.id);
      showView('cycles');
    }
  }

  let lastSub = 0;

  return (
    <section className="view">
      <div className="page-head">
        <button className="btn ghost sm" onClick={() => showView('cycles')}>
          ← Ciclos
        </button>
        <div style={{ flex: '1 1 280px' }}>
          <span className="eyebrow">{m ? m.name : 'sem método definido'}</span>
          <h1>{c.name}</h1>
          {m?.definition && <div className="method-note">{m.definition}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => openCycleDialog(c))}>
            Editar
          </button>
          <button className="btn ghost sm danger" onClick={() => gate(cloud.locked, handleDelete)}>
            Excluir
          </button>
        </div>
      </div>

      <div className="stats">
        <Stat label="Valor inicial" value={money(c.initial)} />
        <Stat label="Banca do ciclo" value={money(r.bank)} />
        <Stat label="Meta deste ciclo" value={r.active ? money(r.active.start * 2) : '—'} />
        <Stat label="Lucro do ciclo atual" value={r.active ? money(activeProfit) : '—'} valueClass={r.active ? cls(activeProfit) : undefined} sub="desde a última virada" />
        <Stat label="Total sacado" value={money(r.withdrawn)} valueClass="pos" />
        <Stat label="Patrimônio" value={money(r.total)} />
        <Stat label="Resultado total" value={money(r.profit)} valueClass={cls(r.profit)} sub="desde o início do ciclo" />
        <Stat label="Aproveitamento" value={pctS(hit, 1)} />
      </div>

      <div className="rail">
        <div className="rail-label">Trilha dos ciclos — cada parada é um saque</div>
        <div className="rail-track">
          {Array.from({ length: c.count }, (_, idx) => {
            const i = idx + 1;
            const sub = r.subs.find((s) => s.index === i);
            const state = sub ? (sub.closed ? 'done' : 'now') : '';
            const prog = sub && !sub.closed ? Math.max(0, Math.min(1, (r.bank - sub.start) / (sub.start || 1))) : sub ? 1 : 0;
            const rule = i === c.count ? 'saca tudo' : i === 1 ? 'saca o inicial' : `saca ${pctS(c.withdrawPct ?? 50, 0)}`;
            return (
              <div className={'station ' + state} key={i}>
                <div className="rail-line" />
                <div className="dot" />
                <div className="station-body">
                  <div className="lbl">Ciclo {i}</div>
                  <div className="val">
                    {sub ? money(sub.start) : '—'} → {sub ? money(sub.start * 2) : '—'}
                  </div>
                  {sub?.closed ? <div className="take">saque {money(sub.take!)}</div> : <div className="val" style={{ opacity: 0.6 }}>{rule}</div>}
                  {state === 'now' && (
                    <div className="bar">
                      <i style={{ width: (prog * 100).toFixed(1) + '%' }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid two-col" style={{ gridTemplateColumns: '330px 1fr' }}>
        <div className="card">
          <div className="section-title">
            <h3>Próxima entrada</h3>
          </div>
          {r.finished ? (
            <div className="next-target">
              <div className="t">
                <b style={{ color: 'var(--mint)' }}>Concluído</b>
                <span>{c.count} ciclos</span>
              </div>
              <div className="sub">
                Sacado {money(r.withdrawn)} · lucro {money(r.profit)}
              </div>
            </div>
          ) : (
            <div className="next-target">
              <div className="t">
                <b>{money(nextTarget!)}</b>
                <span>
                  quanto ganhar na entrada {r.local + 1} · ciclo {r.idx}
                </span>
              </div>
              <div className="sub">
                {pctS(r.nextPct)} sobre a banca do ciclo ({money(r.bank)})
              </div>
              <div className="sub dim">{left != null ? `faltam ~${left} greens para fechar o ciclo ${r.idx}` : 'ajuste os parâmetros para fechar'}</div>
            </div>
          )}
          <button
            className="btn primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={r.finished}
            onClick={() => gate(cloud.locked, () => openOpDialog(null, c.id))}
          >
            + Registrar entrada
          </button>
          <div className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
            A entrada entra também nas operações da banca e nos relatórios.
          </div>
        </div>

        <div className="grid" style={{ gap: 14 }}>
          <div className="card">
            <div className="section-title">
              <h3>Evolução da banca do ciclo</h3>
              <span className="chip">
                {money(c.initial)} → {money(r.total)}
              </span>
            </div>
            <CycleChart cycle={c} result={r} />
          </div>
          <div className="card">
            <div className="section-title">
              <h3>Entradas</h3>
              <span className="chip">
                {r.rows.length} · {r.greens}G / {r.reds}R
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="l">#</th>
                    <th className="l">Jogo</th>
                    <th>Data</th>
                    <th>Alvo</th>
                    <th>Realizado</th>
                    <th>Diferença</th>
                    <th>Banca antes</th>
                    <th>Resultado</th>
                    <th>Banca depois</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => {
                    if (row.orphan) {
                      return (
                        <tr className="clickable" key={row.entry.id} onClick={() => openDetail(row.entry.id)}>
                          <td className="l" data-label="#">—</td>
                          <td className="l" data-label="Jogo">
                            {row.entry.teamA || row.entry.teamB ? `${row.entry.teamA || '?'} × ${row.entry.teamB || '?'}` : 'sem jogo'}
                          </td>
                          <td colSpan={7} className="l dim">
                            registrada após a conclusão
                          </td>
                          <td></td>
                        </tr>
                      );
                    }
                    const sepNeeded = row.sub !== lastSub;
                    if (sepNeeded) lastSub = row.sub!;
                    const sub = sepNeeded ? r.subs.find((s) => s.index === row.sub) : null;
                    return (
                      <Fragment key={row.entry.id}>
                        {sepNeeded && sub && (
                          <tr className="sep-row" key={'sep' + row.sub}>
                            <td colSpan={10}>
                              Ciclo {row.sub} · início {money(sub.start)} · meta {money(sub.start * 2)}
                            </td>
                          </tr>
                        )}
                        <tr className="clickable" key={row.entry.id} onClick={() => openDetail(row.entry.id)}>
                          <td className="l mono" data-label="#">{row.n}</td>
                          <td className="l" data-label="Jogo">
                            {row.entry.teamA || row.entry.teamB ? `${row.entry.teamA || '?'} × ${row.entry.teamB || '?'}` : <span className="dim">sem jogo</span>}
                            <span className="comp">
                              {row.entry.comp}
                              {row.entry.market ? ' · ' + row.entry.market : ''}
                            </span>
                          </td>
                          <td className="mono" data-label="Data">{fmtDate(row.entry.date)}</td>
                          <td className="mono" data-label="Alvo">{pctS(row.pct!)}</td>
                          <td className={'mono ' + cls(row.pctActual!)} data-label="Realizado">{(row.pctActual! > 0 ? '+' : '') + pctS(row.pctActual!)}</td>
                          <td className={'mono ' + cls(row.pctDiff!)} data-label="Diferença">{(row.pctDiff! > 0 ? '+' : '') + pctS(row.pctDiff!)}</td>
                          <td className="mono" data-label="Banca antes">{money(row.before!)}</td>
                          <td data-label="Resultado">
                            <ResultChip result={row.entry.result} pnl={row.entry.pnl} banca={banca} unit={unit} />
                          </td>
                          <td className="mono" data-label="Banca depois">
                            {money(row.after!)}
                            {row.closes && (
                              <span className="chip win" style={{ marginLeft: 4 }}>
                                saque {money(row.take!)}
                              </span>
                            )}
                          </td>
                          <td>
                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openDetail(row.entry.id); }}>
                              ›
                            </button>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                  {!r.finished && simRows.length > 0 && (
                    <>
                      <tr className="sep-row">
                        <td colSpan={10}>Simulação — a partir daqui, se todas forem green</td>
                      </tr>
                      {simRows.map((s) => (
                        <tr key={'sim' + s.n} className="dim" style={{ opacity: 0.6 }}>
                          <td className="l mono" data-label="#">{s.n}</td>
                          <td className="l dim" data-label="Jogo">entrada simulada</td>
                          <td className="mono" data-label="Data">—</td>
                          <td className="mono" data-label="Alvo">{pctS(s.pct)}</td>
                          <td className="mono" data-label="Realizado">—</td>
                          <td className="mono" data-label="Diferença">—</td>
                          <td className="mono" data-label="Banca antes">{money(s.before)}</td>
                          <td data-label="Resultado">
                            <span className="chip">alvo {money(s.target)}</span>
                          </td>
                          <td className="mono" data-label="Banca depois">{money(s.after)}</td>
                          <td></td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            {!r.rows.length && (
              <div className="empty">
                <strong>Sem entradas ainda</strong>Registre a primeira para abrir o ciclo 1.
              </div>
            )}
            {!r.finished && simRows.length > 0 && (
              <div className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
                As linhas esmaecidas são projeção (assumindo green exatamente no alvo) — assim que você registrar a entrada de verdade, ela some da simulação e vira uma linha real ali mesmo.
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">
              <h3>Fechamento por ciclo</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="l">Ciclo</th>
                    <th>Início</th>
                    <th>Entradas</th>
                    <th>Lucro</th>
                    <th>Montante</th>
                    <th>Saque</th>
                    <th>Segue com</th>
                    <th className="l">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r.subs.map((sub) => {
                    const p = (sub.end || 0) - sub.start;
                    return (
                      <tr key={sub.index}>
                        <td className="l mono" data-label="Ciclo">{sub.index}</td>
                        <td className="mono" data-label="Início">{money(sub.start)}</td>
                        <td className="mono" data-label="Entradas">{sub.rows.length}</td>
                        <td className={'mono ' + cls(p)} data-label="Lucro">{money(p)}</td>
                        <td className="mono" data-label="Montante">{money(sub.end || 0)}</td>
                        <td className="mono" data-label="Saque">{sub.closed ? money(sub.take!) : '—'}</td>
                        <td className="mono" data-label="Segue com">{sub.closed ? money(sub.carry!) : '—'}</td>
                        <td className="l" data-label="Status">{sub.closed ? <span className="chip win">fechado</span> : <span className="chip on">em andamento</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
