import Modal from '../common/Modal';
import ResultChip from '../common/ResultChip';
import { useDetailDialogStore, useOpDialogStore } from '../../hooks/useDialogs';
import { useBancaData } from '../../hooks/useBancaData';
import { useDbStore } from '../../hooks/useDbStore';
import { methodName } from '../../lib/engine';
import { cls, fmtDate, money, pctS, un } from '../../lib/format';
import { toast } from '../../hooks/useToast';

export default function DetailDialog() {
  const { open, opId, close } = useDetailDialogStore();
  const openOpDialog = useOpDialogStore((s) => s.openOpDialog);
  const db = useDbStore((s) => s.db);
  const deleteOp = useDbStore((s) => s.deleteOp);
  const { banca, unit, enriched } = useBancaData();

  const o = opId ? enriched.find((x) => x.id === opId) : null;
  if (!open || !o) return null;

  const cyc = o.cycleId ? db.cycles.find((c) => c.id === o.cycleId) : null;

  function handleDelete() {
    if (window.confirm('Excluir esta operação?')) {
      deleteOp(o!.id);
      toast('Operação excluída');
      close();
    }
  }

  function handleEdit() {
    close();
    openOpDialog(db.ops.find((op) => op.id === o!.id) || null, o!.cycleId);
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="dlg-head">
        <h3>{o.teamA || o.teamB ? `${o.teamA || '?'} × ${o.teamB || '?'}` : 'Operação avulsa'}</h3>
        <ResultChip result={o.result} pnl={o.pnl} banca={banca} unit={unit} />
      </div>
      <div className="dlg-body">
        <dl className="kv">
          <dt>Data</dt>
          <dd className="mono">{fmtDate(o.date)}</dd>
          <dt>Competição</dt>
          <dd>{o.comp || '—'}</dd>
          <dt>Método</dt>
          <dd>
            {methodName(db.methods, o.methodId)}
            {cyc && (
              <>
                {' · '}
                <span className="chip on">{cyc.name}</span>
              </>
            )}
          </dd>
          <dt>Mercado</dt>
          <dd>{o.market || '—'}</dd>
          <dt>Stake</dt>
          <dd className="mono">
            {o.stake ? money(o.stake) : '—'}
            {o.odd ? ` · odd ${o.odd}` : ''}
          </dd>
          <dt>Resultado</dt>
          <dd className={'mono ' + cls(o.pnl)}>
            {money(o.pnl)} {o.roi != null ? `· ROI ${pctS(o.roi, 1)}` : ''}
          </dd>
          <dt>Em unidades</dt>
          <dd className={'mono ' + cls(o.pnl)}>
            {banca?.stake ? un(o.pnl / banca.stake) : '—'} · {pctS(banca?.initial ? (o.pnl / banca.initial) * 100 : 0)} da banca
          </dd>
          <dt>Banca depois</dt>
          <dd className="mono">{money(o.after)}</dd>
          <dt>Disciplina</dt>
          <dd>
            {o.exp > 0 ? (
              o.off ? (
                <>
                  <span className="chip warn">fora do método</span> stake {money(o.stake)} vs {money(o.exp)} previstos · no método daria <b className={cls(o.adjPnl)}>{money(o.adjPnl)}</b>
                </>
              ) : (
                <span className="chip win">dentro do método</span>
              )
            ) : (
              <span className="dim">método sem stake definida</span>
            )}
          </dd>
        </dl>
        <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <div style={{ fontSize: '10.5px', letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Observação</div>
          <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', color: o.note ? 'var(--text)' : 'var(--muted)' }}>
            {o.note || 'Sem anotação. Clique em editar para registrar por que entrou, por que fechou ou o que faria diferente.'}
          </div>
        </div>
      </div>
      <div className="dlg-foot">
        <button className="btn ghost danger" onClick={handleDelete}>
          Excluir
        </button>
        <button className="btn ghost" onClick={close}>
          Fechar
        </button>
        <button className="btn primary" onClick={handleEdit}>
          Editar
        </button>
      </div>
    </Modal>
  );
}
