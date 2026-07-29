import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useOpDialogStore } from '../../hooks/useDialogs';
import { useDbStore } from '../../hooks/useDbStore';
import { useBancaData } from '../../hooks/useBancaData';
import { computeCycle, expectedStake } from '../../lib/engine';
import { money, parseNum, pctS, todayISO } from '../../lib/format';
import { toast } from '../../hooks/useToast';
import type { Result } from '../../lib/types';

export default function OpDialog() {
  const { open, editingOp, cycleId, close } = useOpDialogStore();
  const db = useDbStore((s) => s.db);
  const addOp = useDbStore((s) => s.addOp);
  const updateOp = useDbStore((s) => s.updateOp);
  const deleteOp = useDbStore((s) => s.deleteOp);
  const { banca, enriched } = useBancaData();

  const [date, setDate] = useState(todayISO());
  const [methodId, setMethodId] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [comp, setComp] = useState('');
  const [market, setMarket] = useState('');
  const [result, setResult] = useState<Result>('green');
  const [stakeStr, setStakeStr] = useState('');
  const [oddStr, setOddStr] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [note, setNote] = useState('');

  const cyc = cycleId ? db.cycles.find((c) => c.id === cycleId) : null;
  const bank = banca ? banca.initial + enriched.reduce((s, o) => s + o.pnl, 0) : 0;
  const method = db.methods.find((m) => m.id === methodId) || null;

  // Operações de ciclo usam o alvo calculado pelo ciclo como referência de disciplina,
  // não a stake definida no método (o método só empresta nome/definição aqui).
  const cycResult = cyc && banca ? computeCycle(cyc, db.ops) : null;
  const cycRow = cycResult && editingOp ? cycResult.rows.find((row) => !row.orphan && row.entry.id === editingOp.id) : null;
  const cycleExp = cycResult ? (editingOp ? cycRow?.target : !cycResult.finished ? (cycResult.bank * cycResult.nextPct) / 100 : undefined) : undefined;

  useEffect(() => {
    if (!open) return;
    const op = editingOp;
    setDate(op ? op.date : todayISO());
    setMethodId(op ? op.methodId || '' : cyc?.methodId || '');
    setTeamA(op?.teamA || '');
    setTeamB(op?.teamB || '');
    setComp(op?.comp || '');
    setMarket(op?.market || '');
    setStakeStr(op && op.stake ? String(op.stake).replace('.', ',') : '');
    setOddStr(op && op.odd ? String(op.odd).replace('.', ',') : '');
    setValueStr(op ? Math.abs(op.pnl).toFixed(2).replace('.', ',') : '');
    setNote(op?.note || '');
    setResult(op ? op.result : 'green');

    if (!op && banca && cyc) {
      const r = computeCycle(cyc, db.ops);
      if (!r.finished) {
        const t = ((r.bank * r.nextPct) / 100).toFixed(2).replace('.', ',');
        setValueStr(t);
        setStakeStr(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingOp, cycleId]);

  if (!open) return null;

  function handleMethodChange(id: string) {
    setMethodId(id);
    if (!editingOp && banca && !cyc) {
      const m = db.methods.find((x) => x.id === id);
      if (m && !stakeStr) {
        const exp = expectedStake(m, banca, bank);
        if (exp > 0) setStakeStr(exp.toFixed(2).replace('.', ','));
      }
    }
  }

  function autoValue(nextStake = stakeStr, nextOdd = oddStr, nextResult = result) {
    const stake = parseNum(nextStake);
    const odd = parseNum(nextOdd);
    if (!stake) return;
    if (nextResult === 'green' && odd > 1) setValueStr((stake * (odd - 1)).toFixed(2).replace('.', ','));
    if (nextResult === 'red') setValueStr(stake.toFixed(2).replace('.', ','));
  }

  function stakeHint(): string {
    if (cycleExp != null) {
      const stake = parseNum(stakeStr);
      const tol = method ? Number(method.tolerance) || 0 : 5;
      if (stake > cycleExp * (1 + tol / 100) && stake > 0) {
        return `Fora do ciclo: o alvo desta entrada é ${money(cycleExp)} (+${pctS(tol, 0)} de tolerância). Vai entrar no relatório de disciplina.`;
      }
      return `Alvo do ciclo: ${money(cycleExp)} · tolerância ${pctS(tol, 0)}.`;
    }
    if (!method || !(Number(method.stakeValue) > 0) || !banca) return 'Sem stake definida para este método — a operação não entra no controle de disciplina.';
    const exp = expectedStake(method, banca, bank);
    const stake = parseNum(stakeStr);
    const tol = Number(method.tolerance) || 0;
    if (stake > exp * (1 + tol / 100) && stake > 0) return `Fora do método: a stake de ${method.name} é ${money(exp)} (+${pctS(tol, 0)} de tolerância). Vai entrar no relatório de disciplina.`;
    return `Stake do método: ${money(exp)} · tolerância ${pctS(tol, 0)}.`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = Math.abs(parseNum(valueStr));
    const data = {
      date: date || todayISO(),
      methodId: methodId || null,
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      comp: comp.trim(),
      market: market.trim(),
      stake: parseNum(stakeStr),
      odd: parseNum(oddStr),
      result,
      pnl: result === 'green' ? raw : result === 'red' ? -raw : 0,
      note: note.trim(),
    };
    if (editingOp) updateOp(editingOp.id, data);
    else addOp(data, cycleId);
    toast(editingOp ? 'Operação atualizada' : 'Operação registrada');
    close();
  }

  function handleDelete() {
    if (editingOp && window.confirm('Excluir esta operação?')) {
      deleteOp(editingOp.id);
      toast('Operação excluída');
      close();
    }
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={handleSubmit}>
        <div className="dlg-head">
          <h3>{editingOp ? 'Editar operação' : 'Nova operação'}</h3>
          {cyc && <span className="chip">Ciclo: {cyc.name}</span>}
        </div>
        <div className="dlg-body">
          {cycResult && !editingOp && !cycResult.finished && (
            <div className="next-target">
              <div className="t">
                <b>{pctS(cycResult.nextPct)}</b>
                <span>
                  ciclo {cycResult.idx} · entrada {cycResult.local + 1}
                </span>
              </div>
              <div className="sub">
                lucro alvo {money((cycResult.bank * cycResult.nextPct) / 100)} sobre {money(cycResult.bank)}
              </div>
            </div>
          )}
          <div className="row c2">
            <label className="field">
              <span>Data</span>
              <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Método</span>
              <select value={methodId} onChange={(e) => handleMethodChange(e.target.value)}>
                <option value="">— sem método —</option>
                {db.methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="vs">
            <label className="field" style={{ margin: 0 }}>
              <span>Time mandante</span>
              <input value={teamA} onChange={(e) => setTeamA(e.target.value)} list="dlTeams" placeholder="Ex.: Bahia" />
            </label>
            <span className="x">×</span>
            <label className="field" style={{ margin: 0 }}>
              <span>Time visitante</span>
              <input value={teamB} onChange={(e) => setTeamB(e.target.value)} list="dlTeams" placeholder="Ex.: Vitória" />
            </label>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Competição</span>
            <input value={comp} onChange={(e) => setComp(e.target.value)} list="dlComps" placeholder="Ex.: Brasileirão Série A" />
          </label>
          <label className="field">
            <span>Mercado / entrada</span>
            <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Ex.: Over 0.5 HT · lay 0x0" />
          </label>

          <label className="field">
            <span>Resultado</span>
          </label>
          <div className="seg" style={{ marginTop: -8 }}>
            {(['green', 'red', 'void'] as Result[]).map((r) => (
              <button
                key={r}
                type="button"
                data-r={r}
                aria-pressed={result === r}
                onClick={() => {
                  setResult(r);
                  if (r === 'void') setValueStr('0');
                  else autoValue(stakeStr, oddStr, r);
                }}
              >
                {r === 'green' ? 'Green' : r === 'red' ? 'Red' : 'Anulada'}
              </button>
            ))}
          </div>

          <div className="row c3">
            <label className="field">
              <span>Stake (R$)</span>
              <input
                className="num-in"
                inputMode="decimal"
                value={stakeStr}
                placeholder="0,00"
                onChange={(e) => {
                  setStakeStr(e.target.value);
                  autoValue(e.target.value, oddStr, result);
                }}
              />
            </label>
            <label className="field">
              <span>Odd (opcional)</span>
              <input
                className="num-in"
                inputMode="decimal"
                value={oddStr}
                placeholder="2,00"
                onChange={(e) => {
                  setOddStr(e.target.value);
                  autoValue(stakeStr, e.target.value, result);
                }}
              />
            </label>
            <label className="field">
              <span>{result === 'red' ? 'Prejuízo (R$)' : 'Lucro (R$)'}</span>
              <input className="num-in" inputMode="decimal" value={valueStr} placeholder="0,00" onChange={(e) => setValueStr(e.target.value)} />
            </label>
          </div>
          <div className="hint">{stakeHint()}</div>

          <label className="field">
            <span>Observação — por que entrou, por que fechou, o que errou</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: entrei antes do sinal, jogo travado, fechei no 70' com prejuízo menor..." />
          </label>
        </div>
        <div className="dlg-foot">
          {editingOp && (
            <button type="button" className="btn ghost danger" onClick={handleDelete}>
              Excluir
            </button>
          )}
          <button type="button" className="btn ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Salvar operação
          </button>
        </div>
      </form>
    </Modal>
  );
}
