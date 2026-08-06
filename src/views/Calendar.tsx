import { useMemo } from 'react';
import { useBancaData } from '../hooks/useBancaData';
import { useUiStore } from '../hooks/useUiStore';
import { useDetailDialogStore } from '../hooks/useDialogs';
import { summarize } from '../lib/engine';
import { methodName } from '../lib/engine';
import { cls, fmtDate, fmtV, MESL, pctS } from '../lib/format';
import ResultChip from '../components/common/ResultChip';

const DOW = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export default function CalendarView() {
  const { db, banca, unit, enriched } = useBancaData();
  const { calYear, calMonth, calSel, calShift, setCalSel } = useUiStore();
  const openDetail = useDetailDialogStore((s) => s.openDetail);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof enriched>();
    enriched.forEach((o) => {
      if (!map.has(o.date)) map.set(o.date, []);
      map.get(o.date)!.push(o);
    });
    return map;
  }, [enriched]);

  const first = new Date(calYear, calMonth, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(calYear, calMonth + 1, 0).getDate();

  let monthPnl = 0;
  let monthOps = 0;
  const cells: { key: string; day: number }[] = [];
  for (let d = 1; d <= days; d++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ops = byDay.get(key) || [];
    if (ops.length) {
      monthPnl += ops.reduce((s, o) => s + o.pnl, 0);
      monthOps += ops.length;
    }
    cells.push({ key, day: d });
  }

  const selOps = calSel ? byDay.get(calSel) : null;
  const selSummary = selOps ? summarize(selOps, banca) : null;

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Rotina</span>
          <h1>Calendário</h1>
          <p>Resultado dia a dia. Clique em um dia para ver as operações.</p>
        </div>
      </div>
      <div className="grid two-col">
        <div className="card">
          <div className="cal-head">
            <button className="icon-btn" onClick={() => calShift(-1)}>
              ‹
            </button>
            <h3 style={{ fontSize: 19 }}>
              {MESL[calMonth]} {calYear}
            </h3>
            <button className="icon-btn" onClick={() => calShift(1)}>
              ›
            </button>
          </div>
          <div className="cal-grid">
            {DOW.map((d) => (
              <div className="cal-dow" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="cal-grid" style={{ marginTop: 5 }}>
            {Array.from({ length: lead }, (_, i) => (
              <div className="cal-day void" key={'lead' + i} />
            ))}
            {cells.map(({ key, day }) => {
              const ops = byDay.get(key) || [];
              const pnl = ops.reduce((s, o) => s + o.pnl, 0);
              const k = ops.length ? (pnl > 0 ? 'win' : pnl < 0 ? 'loss' : '') : '';
              return (
                <div className={'cal-day ' + k + (calSel === key ? ' sel' : '')} key={key} onClick={() => ops.length && setCalSel(key)}>
                  <div className="d">{day}</div>
                  {ops.length > 0 && (
                    <>
                      <div className={'v ' + cls(pnl)}>{fmtV(pnl, banca, unit)}</div>
                      <div className="n">
                        {ops.length} op{ops.length > 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="cal-legend">
            <span>
              <i className="dot" style={{ background: 'rgba(61,220,151,.4)' }} />
              dia positivo
            </span>
            <span>
              <i className="dot" style={{ background: 'rgba(255,107,97,.4)' }} />
              dia negativo
            </span>
            <span className="mono">
              <span className="dim">mês:</span> <b className={cls(monthPnl)}>{fmtV(monthPnl, banca, unit)}</b> <span className="dim">em {monthOps} operações</span>
            </span>
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>{calSel ? fmtDate(calSel) : 'Selecione um dia'}</h3>
          </div>
          {!selOps || !selSummary ? (
            <div className="empty" style={{ border: 0, padding: '24px 0' }}>
              Clique em um dia com operações.
            </div>
          ) : (
            <>
              <div className="figures" style={{ marginTop: 0 }}>
                <div className="fig">
                  <small>Resultado</small>
                  <span className={cls(selSummary.pnl)}>{fmtV(selSummary.pnl, banca, unit)}</span>
                </div>
                <div className="fig">
                  <small>Operações</small>
                  <span>{selSummary.n}</span>
                </div>
                <div className="fig">
                  <small>Acerto</small>
                  <span>{pctS(selSummary.hit, 0)}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {selOps.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => openDetail(o.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: 10, border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer', minWidth: 0 }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : 'sem jogo'}
                      </div>
                      <div className="dim" style={{ fontSize: 11 }}>
                        {methodName(db.methods, o.methodId)}
                        {o.comp ? ' · ' + o.comp : ''}
                      </div>
                    </div>
                    <ResultChip result={o.result} pnl={o.pnl} banca={banca} unit={unit} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
