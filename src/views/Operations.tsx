import { useMemo, useState } from 'react';
import { useBancaData } from '../hooks/useBancaData';
import { useOpDialogStore, useDetailDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { inPeriod, methodName, summarize } from '../lib/engine';
import { cls, fmtDate, fmtV, money, pctS } from '../lib/format';
import Stat from '../components/common/Stat';
import ResultChip from '../components/common/ResultChip';

export default function Operations() {
  const { db, banca, unit, enriched } = useBancaData();
  const openOpDialog = useOpDialogStore((s) => s.openOpDialog);
  const openDetail = useDetailDialogStore((s) => s.openDetail);
  const cloud = useCloud();

  const [period, setPeriod] = useState('all');
  const [method, setMethod] = useState('all');
  const [comp, setComp] = useState('all');
  const [result, setResult] = useState('all');
  const [scope, setScope] = useState('all');
  const [text, setText] = useState('');

  const filtered = useMemo(() => {
    let list = inPeriod(enriched, period);
    if (method !== 'all') list = list.filter((o) => (o.methodId || '__none') === method);
    if (comp !== 'all') list = list.filter((o) => (o.comp || '') === comp);
    if (result !== 'all') list = list.filter((o) => o.result === result);
    if (scope === 'cycle') list = list.filter((o) => o.cycleId);
    if (scope === 'free') list = list.filter((o) => !o.cycleId);
    if (scope === 'off') list = list.filter((o) => o.off);
    const t = text.trim().toLowerCase();
    if (t) list = list.filter((o) => [o.teamA, o.teamB, o.comp, o.market, o.note].join(' ').toLowerCase().includes(t));
    return list;
  }, [enriched, period, method, comp, result, scope, text]);

  const s = useMemo(() => summarize(filtered, banca), [filtered, banca]);

  function clearFilters() {
    setPeriod('all');
    setResult('all');
    setScope('all');
    setText('');
  }

  let cum = 0;
  const rows = filtered.map((o) => {
    cum += o.pnl;
    return { o, cum };
  });
  rows.reverse();

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Registro</span>
          <h1>Operações</h1>
          <p>Todas as entradas da banca. As que pertencem a um ciclo aparecem marcadas.</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => gate(cloud.locked, () => openOpDialog(null, null))}>
          + Nova operação
        </button>
      </div>

      <div className="filters">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">Todo o período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="month">Este mês</option>
          <option value="year">Este ano</option>
        </select>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="all">Todos os métodos</option>
          <option value="__none">Sem método</option>
          {db.methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={comp} onChange={(e) => setComp(e.target.value)}>
          <option value="all">Todas as competições</option>
          {db.comps.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="all">Todos os resultados</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="void">Anulada</option>
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">Ciclo e avulsas</option>
          <option value="cycle">Só de ciclos</option>
          <option value="free">Só avulsas</option>
          <option value="off">Só fora do método</option>
        </select>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Buscar time, obs..." />
        <button className="btn ghost sm" onClick={clearFilters}>
          Limpar
        </button>
      </div>

      <div className="stats">
        <Stat label="Operações" value={s.n} sub={`${s.greens}G · ${s.reds}R`} />
        <Stat label="Resultado" value={fmtV(s.pnl, banca, unit)} valueClass={cls(s.pnl)} />
        <Stat label="ROI" value={s.roi == null ? '—' : pctS(s.roi)} valueClass={cls(s.roi || 0)} sub={`stake ${money(s.stake)}`} />
        <Stat label="Acerto" value={pctS(s.hit, 1)} />
        <Stat label="Fora do método" value={s.off} valueClass={s.off ? 'neg' : ''} sub={s.off ? fmtV(s.adj - s.pnl, banca, unit) + ' de diferença' : 'tudo no plano'} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="l">Data</th>
                <th className="l">Jogo</th>
                <th className="l">Método</th>
                <th>Stake</th>
                <th>Resultado</th>
                <th>ROI</th>
                <th>Acumulado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ o, cum: c }) => (
                <tr className="clickable" key={o.id} onClick={() => openDetail(o.id)}>
                  <td className="l mono">{fmtDate(o.date)}</td>
                  <td className="l">
                    {o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : <span className="dim">sem jogo</span>}
                    <span className="comp">
                      {o.comp}
                      {o.market ? ' · ' + o.market : ''}
                    </span>
                  </td>
                  <td className="l" style={{ fontSize: 12 }}>
                    {methodName(db.methods, o.methodId)}
                    {o.cycleId && (
                      <span className="chip on" style={{ marginLeft: 4 }}>
                        ciclo
                      </span>
                    )}
                    {o.off && (
                      <span className="chip warn" style={{ marginLeft: 4 }}>
                        fora
                      </span>
                    )}
                  </td>
                  <td className="mono">{o.stake ? money(o.stake) : '—'}</td>
                  <td>
                    <ResultChip result={o.result} pnl={o.pnl} banca={banca} unit={unit} />
                  </td>
                  <td className={'mono ' + cls(o.roi || 0)}>{o.roi == null ? '—' : pctS(o.roi, 1)}</td>
                  <td className={'mono ' + cls(c)}>{fmtV(c, banca, unit)}</td>
                  <td>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openDetail(o.id); }}>
                      ›
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="empty">
            <strong>Nenhuma operação</strong>Registre a primeira entrada desta banca.
          </div>
        )}
      </div>
    </section>
  );
}
