import { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Chip from '../common/Chip';
import { useImportStatementStore } from '../../hooks/useDialogs';
import { useDbStore } from '../../hooks/useDbStore';
import { toast } from '../../hooks/useToast';
import { parseNum, money, fmtDate } from '../../lib/format';
import type { ParsedBet } from '../../lib/statementImport';
import type { Result } from '../../lib/types';

interface DraftBet {
  key: string;
  selected: boolean;
  expanded: boolean;
  alreadyImported: boolean;
  date: string;
  teamA: string;
  teamB: string;
  comp: string;
  market: string;
  stake: string;
  odd: string;
  pnl: string;
  note: string;
  methodId: string;
  cycleId: string;
  legsText: string;
}

function toDraft(bet: ParsedBet): DraftBet {
  return {
    key: bet.marketId,
    selected: !bet.alreadyImported,
    expanded: false,
    alreadyImported: bet.alreadyImported,
    date: bet.date,
    teamA: bet.teamA,
    teamB: bet.teamB,
    comp: bet.comp,
    market: bet.market,
    stake: bet.stake.toFixed(2).replace('.', ','),
    odd: bet.odd.toFixed(2).replace('.', ','),
    pnl: bet.pnl.toFixed(2).replace('.', ','),
    note: bet.note,
    methodId: '',
    cycleId: '',
    legsText: bet.legs
      .map((l) => `${l.side}${l.selection ? ' ' + l.selection : ''} · stake ${money(l.stake)} · odd ${l.odds ? l.odds.toFixed(2) : '—'} · ${l.amount >= 0 ? '+' : ''}${money(l.amount)}`)
      .join('\n'),
  };
}

function resultOf(pnl: number): Result {
  return pnl > 1e-9 ? 'green' : pnl < -1e-9 ? 'red' : 'void';
}

export default function ImportStatementDialog() {
  const { open, bets, close } = useImportStatementStore();
  const db = useDbStore((s) => s.db);
  const importStatementBets = useDbStore((s) => s.importStatementBets);
  const [drafts, setDrafts] = useState<DraftBet[]>([]);
  const [initialized, setInitialized] = useState<ParsedBet[] | null>(null);

  if (open && initialized !== bets) {
    setDrafts(bets.map(toDraft));
    setInitialized(bets);
  }

  const cycles = useMemo(() => db.cycles.filter((c) => c.bancaId === db.activeBanca), [db.cycles, db.activeBanca]);

  if (!open) return null;

  const selectedCount = drafts.filter((d) => d.selected).length;
  const dupCount = drafts.filter((d) => d.alreadyImported).length;

  function patch(key: string, partial: Partial<DraftBet>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...partial } : d)));
  }

  function handleConfirm() {
    const toImport = drafts.filter((d) => d.selected);
    if (!toImport.length) {
      toast('Nenhuma aposta selecionada.');
      return;
    }
    const entries = toImport.map((d) => {
      const pnl = parseNum(d.pnl);
      return {
        cycleId: d.cycleId || null,
        date: d.date,
        teamA: d.teamA.trim(),
        teamB: d.teamB.trim(),
        comp: d.comp.trim(),
        methodId: d.methodId || null,
        market: d.market.trim(),
        stake: parseNum(d.stake),
        odd: parseNum(d.odd),
        result: resultOf(pnl),
        pnl,
        note: d.note,
        sourceMarketId: d.key,
      };
    });
    importStatementBets(entries, toImport.map((d) => d.key));
    toast(`${entries.length} operação${entries.length > 1 ? 'ões' : ''} importada${entries.length > 1 ? 's' : ''}`);
    close();
  }

  return (
    <Modal open={open} onClose={close} className="wide">
      <div className="dlg-head">
        <h3>Importar extrato</h3>
      </div>
      <div className="dlg-body">
        <div className="import-summary">
          <span>
            <b>{drafts.length}</b> aposta{drafts.length !== 1 ? 's' : ''} encontrada{drafts.length !== 1 ? 's' : ''} no extrato
          </span>
          <span>
            <b className="pos">{selectedCount}</b> selecionada{selectedCount !== 1 ? 's' : ''} para importar
          </span>
          {dupCount > 0 && (
            <span className="dim">
              <b>{dupCount}</b> já importada{dupCount !== 1 ? 's' : ''} antes — desmarcada{dupCount !== 1 ? 's' : ''} por padrão, marque se quiser importar de novo
            </span>
          )}
        </div>

        <div className="import-list">
          {drafts.map((d) => {
            const pnl = parseNum(d.pnl);
            const result = resultOf(pnl);
            return (
              <div key={d.key} className={'import-row' + (d.alreadyImported ? ' dup' : !d.selected ? ' unchecked' : '')}>
                <div className="import-row-head">
                  <input
                    type="checkbox"
                    checked={d.selected}
                    onChange={(e) => patch(d.key, { selected: e.target.checked })}
                  />
                  <div className="import-row-main">
                    <div>
                      <div className="import-row-title">
                        {d.teamA || d.teamB ? `${d.teamA || '?'} × ${d.teamB || '?'}` : d.market || 'Ajuste sem aposta associada'}
                        {d.alreadyImported && (
                          <span className="chip" style={{ marginLeft: 8 }}>
                            já importada
                          </span>
                        )}
                      </div>
                      <div className="import-row-sub">
                        {fmtDate(d.date)} · {d.comp || 'sem competição'} {d.market ? '· ' + d.market : ''}
                      </div>
                    </div>
                    <div className="import-row-figs">
                      <Chip kind={result === 'green' ? 'win' : result === 'red' ? 'loss' : undefined}>
                        {(pnl > 0 ? '+' : '') + money(pnl)}
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="import-row-selects">
                  <select value={d.methodId} onChange={(e) => patch(d.key, { methodId: e.target.value })}>
                    <option value="">— sem método —</option>
                    {db.methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <select value={d.cycleId} onChange={(e) => patch(d.key, { cycleId: e.target.value })}>
                    <option value="">— avulsa (sem ciclo) —</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="button" className="import-row-toggle" onClick={() => patch(d.key, { expanded: !d.expanded })}>
                  {d.expanded ? 'Ocultar detalhes' : 'Editar detalhes e ver lances'}
                </button>

                {d.expanded && (
                  <div className="import-row-detail">
                    <div className="row c3">
                      <label className="field" style={{ margin: 0 }}>
                        <span>Data</span>
                        <input type="date" value={d.date} onChange={(e) => patch(d.key, { date: e.target.value })} />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Time mandante</span>
                        <input value={d.teamA} onChange={(e) => patch(d.key, { teamA: e.target.value })} />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Time visitante</span>
                        <input value={d.teamB} onChange={(e) => patch(d.key, { teamB: e.target.value })} />
                      </label>
                    </div>
                    <div className="row c2">
                      <label className="field" style={{ margin: 0 }}>
                        <span>Competição</span>
                        <input value={d.comp} onChange={(e) => patch(d.key, { comp: e.target.value })} />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Mercado</span>
                        <input value={d.market} onChange={(e) => patch(d.key, { market: e.target.value })} />
                      </label>
                    </div>
                    <div className="row c3">
                      <label className="field" style={{ margin: 0 }}>
                        <span>Stake (R$)</span>
                        <input className="num-in" inputMode="decimal" value={d.stake} onChange={(e) => patch(d.key, { stake: e.target.value })} />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Odd média</span>
                        <input className="num-in" inputMode="decimal" value={d.odd} onChange={(e) => patch(d.key, { odd: e.target.value })} />
                      </label>
                      <label className="field" style={{ margin: 0 }}>
                        <span>Resultado (R$)</span>
                        <input className="num-in" inputMode="decimal" value={d.pnl} onChange={(e) => patch(d.key, { pnl: e.target.value })} />
                      </label>
                    </div>
                    <label className="field" style={{ margin: 0 }}>
                      <span>Observação</span>
                      <textarea value={d.note} onChange={(e) => patch(d.key, { note: e.target.value })} />
                    </label>
                    {d.legsText && (
                      <div>
                        <div className="hint" style={{ marginBottom: 4 }}>
                          Lances do extrato (back/lay) que formam esta aposta:
                        </div>
                        <div className="import-legs">{d.legsText}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="dlg-foot">
        <button type="button" className="btn ghost" onClick={close}>
          Cancelar
        </button>
        <button type="button" className="btn primary" onClick={handleConfirm} disabled={selectedCount === 0}>
          Importar {selectedCount} operação{selectedCount !== 1 ? 'ões' : ''}
        </button>
      </div>
    </Modal>
  );
}
