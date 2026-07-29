import Stat from '../common/Stat';
import Chip from '../common/Chip';

export function PainelVisual() {
  const bars = [22, 38, 18, 44, 30, 52, 26, 60, 34, 46, 20, 40];
  return (
    <div>
      <div className="mini-stats">
        <Stat label="Banca atual" value="R$ 1.527,98" />
        <Stat label="Resultado" value="+R$ 527,98" valueClass="pos" />
        <Stat label="ROI" value="17,4%" valueClass="pos" />
      </div>
      <div className="mini-chart">
        {bars.map((h, i) => (
          <i key={i} className={i % 3 === 2 ? 'neg' : 'pos'} style={{ height: (i % 3 === 2 ? h * 0.5 : h) + '%' }} />
        ))}
      </div>
    </div>
  );
}

export function OperacoesVisual() {
  const rows = [
    { game: 'Flamengo × Palmeiras', method: 'Cash out escalonado', win: true, val: '+R$ 39,00' },
    { game: 'Grêmio × Bahia', method: 'Cash out escalonado', win: false, val: '-R$ 43,00' },
    { game: 'Corinthians × Grêmio', method: 'Lay 0x0 até 60’', win: true, val: '+R$ 30,45' },
  ];
  return (
    <div className="mini-table">
      {rows.map((r, i) => (
        <div className="mini-row" key={i}>
          <div className="g">
            <b>{r.game}</b>
            <span>{r.method}</span>
          </div>
          <Chip kind={r.win ? 'win' : 'loss'}>{r.val}</Chip>
        </div>
      ))}
    </div>
  );
}

export function CiclosVisual() {
  return (
    <div>
      <div className="mini-rail">
        <div className="st done">
          <div className="dot" />
          <div className="lbl">Ciclo 1</div>
          <div className="val">saque R$ 500</div>
        </div>
        <div className="st now">
          <div className="dot" />
          <div className="lbl">Ciclo 2</div>
          <div className="val">R$ 835 → R$ 1.000</div>
        </div>
        <div className="st">
          <div className="dot" />
          <div className="lbl">Ciclo 3</div>
          <div className="val">saca tudo</div>
        </div>
      </div>
      <div className="next-target" style={{ marginTop: 16, marginBottom: 0 }}>
        <div className="t">
          <b>3,69%</b>
          <span>entrada 13 · ciclo 1</span>
        </div>
        <div className="sub">faltam ~6 greens para fechar o ciclo</div>
      </div>
    </div>
  );
}

export function RelatoriosVisual() {
  const items = [
    { label: 'Lay 0x0 até 60’', value: 78, kind: 'pos' as const },
    { label: 'Cash out escalonado', value: 60, kind: 'pos' as const },
    { label: 'Over 0.5 HT', value: 32, kind: 'neg' as const },
  ];
  return (
    <div>
      <div className="mini-chart" style={{ marginBottom: 12 }}>
        {items.map((it, i) => (
          <i key={i} className={it.kind} style={{ height: it.value + '%' }} />
        ))}
      </div>
      <div className="mini-table">
        {items.map((it, i) => (
          <div className="mini-row" key={i}>
            <div className="g">
              <b>{it.label}</b>
            </div>
            <Chip kind={it.kind === 'pos' ? 'win' : 'loss'}>{it.kind === 'pos' ? 'lucro' : 'prejuízo'}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarioVisual() {
  const pattern = ['', 'win', '', 'loss', 'win', 'win', '', '', 'win', 'void', 'win', 'loss', 'win', '', 'win', 'win', '', 'loss', 'win', 'win', 'void', '', 'win', 'win', 'loss', 'win', '', 'win'];
  return (
    <div className="mini-cal">
      {pattern.map((k, i) => (
        <i key={i} className={k} />
      ))}
    </div>
  );
}

export function MetodosVisual() {
  const methods = [
    { name: 'Lay 0x0 até 60’', stake: 'R$ 50,00 fixo', tol: '5%' },
    { name: 'Over 0.5 HT', stake: '3% da banca', tol: '10%' },
    { name: 'Cash out escalonado', stake: '2u (R$ 50,00)', tol: '10%' },
  ];
  return (
    <div className="mini-table">
      {methods.map((m, i) => (
        <div className="mini-row" key={i}>
          <div className="g">
            <b>{m.name}</b>
            <span>stake {m.stake}</span>
          </div>
          <Chip>tolerância {m.tol}</Chip>
        </div>
      ))}
    </div>
  );
}

export function CadastrosVisual() {
  const teams = ['Bahia', 'Flamengo', 'Palmeiras', 'Corinthians', 'Grêmio', 'Fortaleza'];
  return (
    <div>
      <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <Stat label="Inicial" value="R$ 1.000" />
        <Stat label="Atual" value="R$ 1.527" />
        <Stat label="Unidade" value="R$ 25" />
      </div>
      <div className="mini-tags">
        {teams.map((t) => (
          <span className="tag" key={t} style={{ paddingRight: 13 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
