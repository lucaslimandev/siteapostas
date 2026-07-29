import { useBancaData } from '../hooks/useBancaData';
import { useDbStore } from '../hooks/useDbStore';
import { useMethodDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { summarize } from '../lib/engine';
import { cls, fmtV, money, pctS } from '../lib/format';
import { toast } from '../hooks/useToast';
import type { Method } from '../lib/types';

function stakeDesc(m: Method, banca: { stake: number } | undefined) {
  if (!(Number(m.stakeValue) > 0)) return 'stake não definida';
  if (m.stakeType === 'pct') return `${pctS(m.stakeValue)} da banca`;
  if (m.stakeType === 'un') return `${m.stakeValue}u (${money(m.stakeValue * (banca?.stake || 0))})`;
  return money(m.stakeValue);
}

export default function Methods() {
  const { db, banca, unit, enriched } = useBancaData();
  const deleteMethod = useDbStore((s) => s.deleteMethod);
  const openMethodDialog = useMethodDialogStore((s) => s.openMethodDialog);
  const cloud = useCloud();

  function handleDelete(id: string) {
    if (window.confirm('Excluir este método? As operações ficam sem método.')) {
      deleteMethod(id);
      toast('Método excluído');
    }
  }

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Biblioteca</span>
          <h1>Métodos</h1>
          <p>Cada método define sua stake padrão. Entradas acima disso são marcadas como fora do método.</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => gate(cloud.locked, () => openMethodDialog(null))}>
          + Novo método
        </button>
      </div>
      <div className="card">
        {!db.methods.length ? (
          <div className="empty" style={{ border: 0 }}>
            <strong>Nenhum método salvo</strong>
            Crie um método com nome, definição e stake para reaproveitar em ciclos e operações.
          </div>
        ) : (
          db.methods.map((m) => {
            const ops = enriched.filter((o) => o.methodId === m.id);
            const s = summarize(ops, banca);
            return (
              <div className="list-item" key={m.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4>{m.name}</h4>
                  <p>{m.definition || 'Sem definição.'}</p>
                  <div className="figures" style={{ margin: '12px 0 0' }}>
                    <div className="fig">
                      <small>Stake</small>
                      <span>{stakeDesc(m, banca)}</span>
                    </div>
                    <div className="fig">
                      <small>Operações</small>
                      <span>{s.n}</span>
                    </div>
                    <div className="fig">
                      <small>Resultado</small>
                      <span className={cls(s.pnl)}>{fmtV(s.pnl, banca, unit)}</span>
                    </div>
                    <div className="fig">
                      <small>ROI</small>
                      <span className={cls(s.roi || 0)}>{s.roi == null ? '—' : pctS(s.roi, 1)}</span>
                    </div>
                    <div className="fig">
                      <small>Acerto</small>
                      <span>{pctS(s.hit, 0)}</span>
                    </div>
                    <div className="fig">
                      <small>Fora do método</small>
                      <span className={s.off ? 'neg' : 'dim'}>{s.off}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" onClick={() => gate(cloud.locked, () => openMethodDialog(m))}>
                    ✎
                  </button>
                  <button className="icon-btn danger" onClick={() => gate(cloud.locked, () => handleDelete(m.id))}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
