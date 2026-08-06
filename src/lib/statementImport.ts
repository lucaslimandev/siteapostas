export type LegSide = 'BACK' | 'LAY' | 'COMMISSION' | 'OTHER';

export interface StatementLeg {
  date: Date;
  description: string;
  system: string;
  betType: string;
  betId: string;
  marketId: string;
  stake: number;
  odds: number;
  amount: number;
  side: LegSide;
  selection: string;
}

export interface ParsedBet {
  /** chave estável — o Market Id do extrato */
  marketId: string;
  date: string;
  comp: string;
  teamA: string;
  teamB: string;
  market: string;
  legs: StatementLeg[];
  betIds: string[];
  stake: number;
  odd: number;
  pnl: number;
  result: 'green' | 'red' | 'void';
  note: string;
  alreadyImported: boolean;
}

/** Excel guarda datas como nº de dias desde 1899-12-30. */
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function toISODate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function parseDescription(desc: string): { comp: string; teamA: string; teamB: string; marketType: string; selection: string; side: LegSide } | null {
  if (!desc || !desc.includes('|')) return null;
  const parts = desc.split('|').map((s) => s.trim());
  const comp = parts[0] || '';
  const teamsPart = parts[1] || '';
  const teamsMatch = teamsPart.split(/\s+vs\s+/i);
  const teamA = (teamsMatch[0] || '').trim();
  const teamB = (teamsMatch[1] || '').trim();
  const marketType = parts[2] || '';
  let selection = parts[3] || '';
  let side: LegSide = 'OTHER';
  if (parts[4] === 'BACK' || parts[4] === 'LAY') {
    side = parts[4] as LegSide;
  } else if (selection === 'COMMISSION') {
    side = 'COMMISSION';
    selection = '';
  }
  return { comp, teamA, teamB, marketType, selection, side };
}

function fmtMoney(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Lê o workbook (.xlsx) exportado da corretora e consolida cada Market Id numa única aposta. */
export async function parseStatementFile(buffer: ArrayBuffer, importedMarketIds: string[]): Promise<ParsedBet[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const legsByMarket = new Map<string, StatementLeg[]>();

  for (const row of rows) {
    const system = String(row['System'] ?? '').trim();
    const betType = String(row['Bet Type'] ?? '').trim();
    if (system === 'PAYMENTS' || betType === 'DEPOSIT' || betType === 'WITHDRAWAL') continue;

    const marketId = String(row['Market Id'] ?? '').trim();
    if (!marketId) continue;

    const description = String(row['Description'] ?? '').trim();
    const parsed = parseDescription(description);
    const dateSerial = num(row['Date']);

    const leg: StatementLeg = {
      date: excelSerialToDate(dateSerial),
      description,
      system,
      betType,
      betId: String(row['Bet Id'] ?? '').trim(),
      marketId,
      stake: num(row['Stake']),
      odds: num(row['Odds']),
      amount: num(row['Amount']),
      side: parsed?.side ?? (betType === 'CHARGE_COMMISSION' ? 'COMMISSION' : 'OTHER'),
      selection: parsed?.selection ?? '',
    };

    if (!legsByMarket.has(marketId)) legsByMarket.set(marketId, []);
    legsByMarket.get(marketId)!.push(leg);
  }

  const bets: ParsedBet[] = [];
  legsByMarket.forEach((legs, marketId) => {
    const withInfo = legs.map((l) => ({ leg: l, info: parseDescription(l.description) })).find((x) => x.info);
    const info = withInfo?.info;

    const tradeLegs = legs.filter((l) => l.side === 'BACK' || l.side === 'LAY');
    const commissionLegs = legs.filter((l) => l.side === 'COMMISSION');

    const stake = tradeLegs.reduce((s, l) => s + l.stake, 0);
    const pnl = legs.reduce((s, l) => s + l.amount, 0);
    const weightedOdd = stake > 0 ? tradeLegs.reduce((s, l) => s + l.stake * l.odds, 0) / stake : 0;

    const selections = [...new Set(tradeLegs.map((l) => l.selection).filter(Boolean))];
    const marketType = info?.marketType || (legs[0].betType === 'CHARGE_COMMISSION' ? 'Comissão' : legs[0].betType) || 'Mercado';
    const marketLabel = selections.length ? `${marketType} — ${selections.slice(0, 3).join(', ')}${selections.length > 3 ? '…' : ''}` : marketType;

    const noteLines = tradeLegs
      .slice()
      .sort((a, b) => a.betId.localeCompare(b.betId))
      .map((l) => `${l.side} ${l.selection || ''} · stake ${fmtMoney(l.stake)} · odd ${l.odds.toFixed(2)} · ${l.amount >= 0 ? '+' : ''}${fmtMoney(l.amount)}`);
    if (commissionLegs.length) {
      const comTotal = commissionLegs.reduce((s, l) => s + l.amount, 0);
      noteLines.push(`Comissão: ${fmtMoney(comTotal)}`);
    }
    const note = `Importado do extrato — ${legs.length} lance${legs.length > 1 ? 's' : ''}:\n${noteLines.join('\n')}`;

    const result: ParsedBet['result'] = pnl > 1e-9 ? 'green' : pnl < -1e-9 ? 'red' : 'void';

    bets.push({
      marketId,
      date: toISODate(legs[0].date),
      comp: info?.comp || '',
      teamA: info?.teamA || '',
      teamB: info?.teamB || '',
      market: marketLabel,
      legs,
      betIds: legs.map((l) => l.betId),
      stake,
      odd: weightedOdd,
      pnl,
      result,
      note,
      alreadyImported: importedMarketIds.includes(marketId),
    });
  });

  bets.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return bets;
}
