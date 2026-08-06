import { useDbStore } from '../hooks/useDbStore';
import { useUiStore } from '../hooks/useUiStore';
import { useCycleDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { computeCycle, methodName } from '../lib/engine';
import { cls, money, pctS } from '../lib/format';
import Chip from '../components/common/Chip';

export default function Cycles() {
  const db = useDbStore((s) => s.db);
  const deleteCycle = useDbStore((s) => s.deleteCycle);
  const openCycle = useUiStore((s) => s.openCycle);
  const openCycleDialog = useCycleDialogStore((s) => s.openCycleDialog);
  const cloud = useCloud();

  const list = db.cycles.filter((c) => c.bancaId === db.activeBanca);

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Excluir "${name}"? As operações do ciclo continuam na banca, apenas desvinculadas.`)) {
      deleteCycle(id);
    }
  }

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Método dos ciclos</span>
          <h1>Ciclos</h1>
          <p>Cada ciclo dobra seu valor em etapas. Ao dobrar, saca e recomeça.</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => gate(cloud.locked, () => openCycleDialog(null))}>
          + Novo ciclo
        </button>
      </div>

      {!list.length ? (
        <div className="empty">
          <strong>Nenhum ciclo nesta banca</strong>
          Crie um ciclo com valor inicial, % por entrada e quantos ciclos internos ele terá.
        </div>
      ) : (
        <div className="grid cycles-grid">
          {list.map((c) => {
            const r = computeCycle(c, db.ops);
            const prog = r.active ? Math.max(0, Math.min(1, (r.bank - r.active.start) / (r.active.start || 1))) : 1;
            const activeProfit = r.active ? r.bank - r.active.start : 0;
            const nextTarget = r.finished ? null : (r.bank * r.nextPct) / 100;
            return (
              <article key={c.id} className="card cycle-card" tabIndex={0} onClick={() => openCycle(c.id)}>
                <div className="card-actions">
                  <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); gate(cloud.locked, () => openCycleDialog(c)); }}>
                    ✎
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Excluir"
                    onClick={(e) => {
                      e.stopPropagation();
                      gate(cloud.locked, () => handleDelete(c.id, c.name));
                    }}
                  >
                    ✕
                  </button>
                </div>
                <h3>{c.name}</h3>
                <div className="meta">
                  {methodName(db.methods, c.methodId)} · {pctS(c.pct)} inicial{c.reduction ? ` · −${pctS(c.reduction)}/entrada` : ''}
                </div>
                <div className="figures">
                  <div className="fig">
                    <small>Banca do ciclo</small>
                    <span>{money(r.bank)}</span>
                  </div>
                  <div className="fig">
                    <small>Lucro do ciclo atual</small>
                    <span className={cls(activeProfit)}>{r.active ? money(activeProfit) : '—'}</span>
                  </div>
                  <div className="fig">
                    <small>Próxima entrada</small>
                    <span>{nextTarget != null ? money(nextTarget) : '—'}</span>
                  </div>
                  <div className="fig">
                    <small>Sacado</small>
                    <span>{money(r.withdrawn)}</span>
                  </div>
                  <div className="fig">
                    <small>Resultado total</small>
                    <span className={cls(r.profit)}>{money(r.profit)}</span>
                  </div>
                </div>
                <div className="bar">
                  <i style={{ width: (prog * 100).toFixed(1) + '%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Chip kind={r.finished ? 'win' : 'on'}>{r.finished ? 'Concluído' : `Ciclo ${r.idx}/${c.count}`}</Chip>
                  <span className="dim" style={{ fontSize: 11.5 }}>
                    {r.rows.length} entradas
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
