import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useMethodDialogStore } from '../../hooks/useDialogs';
import { useDbStore } from '../../hooks/useDbStore';
import { parseNum } from '../../lib/format';
import { toast } from '../../hooks/useToast';
import type { StakeType } from '../../lib/types';

function stakeLabel(t: StakeType) {
  return t === 'pct' ? '% da banca' : t === 'un' ? 'Unidades' : 'Valor (R$)';
}

export default function MethodDialog() {
  const { open, editingMethod, close } = useMethodDialogStore();
  const addMethod = useDbStore((s) => s.addMethod);
  const updateMethod = useDbStore((s) => s.updateMethod);

  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('');
  const [stakeType, setStakeType] = useState<StakeType>('fixo');
  const [stakeVal, setStakeVal] = useState('');
  const [tolerance, setTolerance] = useState('5');

  useEffect(() => {
    if (!open) return;
    const m = editingMethod;
    setName(m?.name || '');
    setDefinition(m?.definition || '');
    setStakeType(m?.stakeType || 'fixo');
    setStakeVal(m && m.stakeValue ? String(m.stakeValue).replace('.', ',') : '');
    setTolerance(m ? String(m.tolerance ?? 5).replace('.', ',') : '5');
  }, [open, editingMethod]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const data = { name: name.trim(), definition: definition.trim(), stakeType, stakeValue: parseNum(stakeVal), tolerance: parseNum(tolerance) };
    if (editingMethod) {
      updateMethod(editingMethod.id, data);
      toast('Método atualizado');
    } else {
      addMethod(data);
      toast('Método criado');
    }
    close();
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={handleSubmit}>
        <div className="dlg-head">
          <h3>{editingMethod ? 'Editar método' : 'Novo método'}</h3>
        </div>
        <div className="dlg-body">
          <label className="field">
            <span>Nome do método</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Lay 0x0 até 60'" />
          </label>
          <label className="field">
            <span>Definição — entrada, saída, gestão de risco</span>
            <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Quando entro, em que minuto, critério de saída, quando aborto..." />
          </label>
          <div className="row c3">
            <label className="field">
              <span>Stake do método</span>
              <select value={stakeType} onChange={(e) => setStakeType(e.target.value as StakeType)}>
                <option value="fixo">Valor fixo (R$)</option>
                <option value="pct">% da banca</option>
                <option value="un">Unidades da banca</option>
              </select>
            </label>
            <label className="field">
              <span>{stakeLabel(stakeType)}</span>
              <input className="num-in" inputMode="decimal" value={stakeVal} onChange={(e) => setStakeVal(e.target.value)} placeholder="50" />
            </label>
            <label className="field">
              <span>Tolerância (%)</span>
              <input className="num-in" inputMode="decimal" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </label>
          </div>
          <div className="hint">Acima da stake + tolerância, a operação é marcada como fora do método e entra no relatório de disciplina.</div>
        </div>
        <div className="dlg-foot">
          <button type="button" className="btn ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Salvar método
          </button>
        </div>
      </form>
    </Modal>
  );
}
