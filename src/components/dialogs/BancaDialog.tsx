import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useBancaDialogStore } from '../../hooks/useDialogs';
import { useDbStore } from '../../hooks/useDbStore';
import { parseNum } from '../../lib/format';
import { toast } from '../../hooks/useToast';

export default function BancaDialog() {
  const { open, editingBanca, close } = useBancaDialogStore();
  const addBanca = useDbStore((s) => s.addBanca);
  const updateBanca = useDbStore((s) => s.updateBanca);

  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [stake, setStake] = useState('');

  useEffect(() => {
    if (!open) return;
    const b = editingBanca;
    setName(b?.name || '');
    setInitial(b ? String(b.initial).replace('.', ',') : '');
    setStake(b ? String(b.stake).replace('.', ',') : '');
  }, [open, editingBanca]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name: name.trim() || 'Banca', initial: parseNum(initial), stake: parseNum(stake) };
    if (editingBanca) {
      updateBanca(editingBanca.id, data);
      toast('Banca atualizada');
    } else {
      addBanca(data);
      toast('Banca criada');
    }
    close();
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={handleSubmit}>
        <div className="dlg-head">
          <h3>{editingBanca ? 'Editar banca' : 'Nova banca'}</h3>
        </div>
        <div className="dlg-body">
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Banca principal" />
          </label>
          <div className="row c2">
            <label className="field">
              <span>Valor inicial (R$)</span>
              <input className="num-in" inputMode="decimal" required value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="1000,00" />
            </label>
            <label className="field">
              <span>Stake padrão — 1 unidade (R$)</span>
              <input className="num-in" inputMode="decimal" required value={stake} onChange={(e) => setStake(e.target.value)} placeholder="20,00" />
            </label>
          </div>
          <div className="hint">A stake padrão vira a unidade (u) usada nos relatórios e no seletor R$ / % / u.</div>
        </div>
        <div className="dlg-foot">
          <button type="button" className="btn ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Salvar banca
          </button>
        </div>
      </form>
    </Modal>
  );
}
