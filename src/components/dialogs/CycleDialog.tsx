import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useCycleDialogStore } from '../../hooks/useDialogs';
import { useUiStore } from '../../hooks/useUiStore';
import { useDbStore } from '../../hooks/useDbStore';
import { parseNum, pctS } from '../../lib/format';
import { toast } from '../../hooks/useToast';

export default function CycleDialog() {
  const { open, editingCycle, close } = useCycleDialogStore();
  const db = useDbStore((s) => s.db);
  const addCycle = useDbStore((s) => s.addCycle);
  const updateCycle = useDbStore((s) => s.updateCycle);
  const openCycle = useUiStore((s) => s.openCycle);

  const [name, setName] = useState('');
  const [methodId, setMethodId] = useState('');
  const [initial, setInitial] = useState('');
  const [count, setCount] = useState('4');
  const [pct, setPct] = useState('5');
  const [reduction, setReduction] = useState('2,5');
  const [minPct, setMinPct] = useState('0');
  const [withdrawPct, setWithdrawPct] = useState('50');
  const [resetPct, setResetPct] = useState(true);

  useEffect(() => {
    if (!open) return;
    const c = editingCycle;
    setName(c?.name || '');
    setMethodId(c?.methodId || '');
    setInitial(c ? String(c.initial).replace('.', ',') : '');
    setCount(String(c?.count ?? 4));
    setPct(c ? String(c.pct).replace('.', ',') : '5');
    setReduction(c ? String(c.reduction || 0).replace('.', ',') : '2,5');
    setMinPct(c ? String(c.minPct || 0).replace('.', ',') : '0');
    setWithdrawPct(c ? String(c.withdrawPct ?? 50).replace('.', ',') : '50');
    setResetPct(c ? c.resetPct !== false : true);
  }, [open, editingCycle]);

  if (!open) return null;

  const p = parseNum(pct);
  const red = parseNum(reduction);
  const m = parseNum(minPct);
  const preview = 'Sequência: ' + [0, 1, 2, 3, 4].map((i) => pctS(Math.max(m, p * Math.pow(1 - red / 100, i)))).join(' → ') + ' …';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: name.trim() || 'Ciclo sem nome',
      methodId: methodId || null,
      initial: parseNum(initial),
      count: Math.max(1, parseInt(count, 10) || 1),
      pct: parseNum(pct) || 1,
      reduction: parseNum(reduction),
      minPct: parseNum(minPct),
      withdrawPct: parseNum(withdrawPct),
      resetPct,
    };
    if (editingCycle) {
      updateCycle(editingCycle.id, data);
      toast('Ciclo atualizado');
    } else {
      const id = addCycle(data);
      toast('Ciclo criado');
      openCycle(id);
    }
    close();
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={handleSubmit}>
        <div className="dlg-head">
          <h3>{editingCycle ? 'Editar ciclo' : 'Novo ciclo'}</h3>
        </div>
        <div className="dlg-body">
          <label className="field">
            <span>Nome do ciclo</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Ciclo de julho" />
          </label>
          <label className="field">
            <span>Método</span>
            <select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">— sem método —</option>
              {db.methods.map((mth) => (
                <option key={mth.id} value={mth.id}>
                  {mth.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row c2">
            <label className="field">
              <span>Valor inicial (R$)</span>
              <input className="num-in" inputMode="decimal" required value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="500,00" />
            </label>
            <label className="field">
              <span>Quantos ciclos internos</span>
              <input className="num-in" type="number" min={1} max={30} step={1} required value={count} onChange={(e) => setCount(e.target.value)} />
            </label>
          </div>
          <div className="row c3">
            <label className="field">
              <span>% inicial</span>
              <input className="num-in" inputMode="decimal" required value={pct} onChange={(e) => setPct(e.target.value)} placeholder="5" />
            </label>
            <label className="field">
              <span>Redução por entrada (%)</span>
              <input className="num-in" inputMode="decimal" value={reduction} onChange={(e) => setReduction(e.target.value)} placeholder="2,5" />
            </label>
            <label className="field">
              <span>% mínima</span>
              <input className="num-in" inputMode="decimal" value={minPct} onChange={(e) => setMinPct(e.target.value)} placeholder="0" />
            </label>
          </div>
          <div className="hint">{preview}</div>
          <label className="field">
            <span>Saque a partir do ciclo 2 (% do montante)</span>
            <input className="num-in" inputMode="decimal" value={withdrawPct} onChange={(e) => setWithdrawPct(e.target.value)} />
          </label>
          <label style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={resetPct} onChange={(e) => setResetPct(e.target.checked)} style={{ width: 'auto' }} /> Reiniciar a % na primeira entrada de cada ciclo
          </label>
          <div className="hint" style={{ marginTop: 12 }}>
            Ciclo 1 saca o valor inicial ao dobrar. Ciclos seguintes sacam a % acima. O último saca tudo.
          </div>
        </div>
        <div className="dlg-foot">
          <button type="button" className="btn ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Salvar ciclo
          </button>
        </div>
      </form>
    </Modal>
  );
}
