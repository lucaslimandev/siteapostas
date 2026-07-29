import { useDbStore } from '../hooks/useDbStore';
import { useBancaDialogStore, gate } from '../hooks/useDialogs';
import { useCloud } from '../hooks/useCloudContext';
import { cls, money } from '../lib/format';
import { toast } from '../hooks/useToast';

export default function Registry() {
  const db = useDbStore((s) => s.db);
  const setActiveBanca = useDbStore((s) => s.setActiveBanca);
  const deleteBanca = useDbStore((s) => s.deleteBanca);
  const remember = useDbStore((s) => s.remember);
  const removeRegistryItem = useDbStore((s) => s.removeRegistryItem);
  const openBancaDialog = useBancaDialogStore((s) => s.openBancaDialog);
  const cloud = useCloud();

  function handleDeleteBanca(id: string) {
    if (window.confirm('Excluir esta banca e TODAS as operações e ciclos dela?')) {
      deleteBanca(id);
      toast('Banca excluída');
    }
  }

  function handleAdd(list: 'teams' | 'comps') {
    const v = window.prompt(list === 'teams' ? 'Nome do time' : 'Nome da competição');
    if (v && v.trim()) remember(list, v.trim());
  }

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <span className="eyebrow">Base</span>
          <h1>Cadastros</h1>
          <p>Bancas, times e competições. O que você digita nas operações é salvo aqui automaticamente.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-title">
          <h3>Bancas</h3>
          <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => openBancaDialog(null))}>
            + Nova banca
          </button>
        </div>
        {db.bancas.map((b) => {
          const ops = db.ops.filter((o) => o.bancaId === b.id);
          const pnl = ops.reduce((s, o) => s + o.pnl, 0);
          const isActive = b.id === db.activeBanca;
          return (
            <div className="list-item" key={b.id}>
              <div style={{ flex: 1 }}>
                <h4>
                  {b.name} {isActive && <span className="chip on" style={{ marginLeft: 6 }}>ativa</span>}
                </h4>
                <div className="figures" style={{ margin: '10px 0 0' }}>
                  <div className="fig">
                    <small>Inicial</small>
                    <span>{money(b.initial)}</span>
                  </div>
                  <div className="fig">
                    <small>Atual</small>
                    <span>{money(b.initial + pnl)}</span>
                  </div>
                  <div className="fig">
                    <small>Unidade</small>
                    <span>{money(b.stake)}</span>
                  </div>
                  <div className="fig">
                    <small>Operações</small>
                    <span>{ops.length}</span>
                  </div>
                  <div className="fig">
                    <small>Resultado</small>
                    <span className={cls(pnl)}>{money(pnl)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isActive && (
                  <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => { setActiveBanca(b.id); toast('Banca ativada'); })}>
                    Ativar
                  </button>
                )}
                <button className="icon-btn" onClick={() => gate(cloud.locked, () => openBancaDialog(b))}>
                  ✎
                </button>
                {db.bancas.length > 1 && (
                  <button className="icon-btn danger" onClick={() => gate(cloud.locked, () => handleDeleteBanca(b.id))}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid two-col" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="section-title">
            <h3>Times</h3>
            <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => handleAdd('teams'))}>
              + Adicionar
            </button>
          </div>
          <div className="tag-cloud">
            {db.teams.length ? (
              db.teams.map((t) => (
                <span className="tag" key={t}>
                  {t}
                  <button onClick={() => gate(cloud.locked, () => removeRegistryItem('teams', t))}>✕</button>
                </span>
              ))
            ) : (
              <span className="dim" style={{ fontSize: 13 }}>
                Nada salvo ainda — o que você digitar nas operações aparece aqui.
              </span>
            )}
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>Competições</h3>
            <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => handleAdd('comps'))}>
              + Adicionar
            </button>
          </div>
          <div className="tag-cloud">
            {db.comps.length ? (
              db.comps.map((c) => (
                <span className="tag" key={c}>
                  {c}
                  <button onClick={() => gate(cloud.locked, () => removeRegistryItem('comps', c))}>✕</button>
                </span>
              ))
            ) : (
              <span className="dim" style={{ fontSize: 13 }}>
                Nada salvo ainda — o que você digitar nas operações aparece aqui.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
