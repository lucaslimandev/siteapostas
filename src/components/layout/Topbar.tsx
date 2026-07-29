import { useRef } from 'react';
import Logo from '../common/Logo';
import { useDbStore } from '../../hooks/useDbStore';
import { useUiStore, type View } from '../../hooks/useUiStore';
import type { Unit } from '../../lib/types';
import { todayISO } from '../../lib/format';
import { toast } from '../../hooks/useToast';
import { useCloud } from '../../hooks/useCloudContext';
import { gate, useAccountDialogStore, useAuthDialogStore } from '../../hooks/useDialogs';

const TABS: { view: View; label: string }[] = [
  { view: 'dash', label: 'Painel' },
  { view: 'ops', label: 'Operações' },
  { view: 'cycles', label: 'Ciclos' },
  { view: 'reports', label: 'Relatórios' },
  { view: 'calendar', label: 'Calendário' },
  { view: 'methods', label: 'Métodos' },
  { view: 'registry', label: 'Cadastros' },
];

const UNITS: { u: Unit; label: string }[] = [
  { u: 'money', label: 'R$' },
  { u: 'pct', label: '%' },
  { u: 'un', label: 'u' },
];

export default function Topbar() {
  const cloud = useCloud();
  const openAuth = useAuthDialogStore((s) => s.openAuth);
  const openAccount = useAccountDialogStore((s) => s.openAccount);
  const db = useDbStore((s) => s.db);
  const setActiveBanca = useDbStore((s) => s.setActiveBanca);
  const setUnit = useDbStore((s) => s.setUnit);
  const importDb = useDbStore((s) => s.importDb);
  const view = useUiStore((s) => s.view);
  const showView = useUiStore((s) => s.showView);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeKey = view === 'cycle' ? 'cycles' : view;

  function handleExport() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `banca-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup exportado');
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const inc = JSON.parse(String(rd.result));
        if (!window.confirm('Substituir os dados atuais pelo arquivo importado?')) return;
        importDb(inc);
        showView('dash');
        toast('Dados importados');
      } catch {
        toast('Arquivo inválido — use um backup exportado aqui.');
      }
    };
    rd.readAsText(f);
    e.target.value = '';
  }

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => showView('dash')} type="button">
          <Logo size={34} className="mark" />
          <div>
            <b>BANCA</b>
            <small>trade esportivo</small>
          </div>
        </button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.view} className={'tab' + (activeKey === t.view ? ' is-on' : '')} onClick={() => showView(t.view)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="right">
          {cloud.cloudEnabled && (
            <button className="btn ghost sm" id="btnAccount" onClick={() => (cloud.user ? openAccount() : openAuth('in'))}>
              <i className={'cloud-dot' + (cloud.status === 'sync' ? ' sync' : cloud.status === 'off' ? ' off' : '')} />
              {cloud.user ? <span className="avatar">{(cloud.user.email || '?')[0].toUpperCase()}</span> : null}
              <span>{cloud.user ? 'Conta' : 'Entrar'}</span>
            </button>
          )}
          <select className="pill-select" title="Banca ativa" value={db.activeBanca ?? ''} onChange={(e) => setActiveBanca(e.target.value)}>
            {db.bancas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="unit-toggle" title="Como exibir os resultados">
            {UNITS.map((x) => (
              <button key={x.u} className={db.settings.unit === x.u ? 'on' : ''} onClick={() => setUnit(x.u)}>
                {x.label}
              </button>
            ))}
          </div>
          <button className="btn ghost sm" onClick={handleExport}>
            Exportar
          </button>
          <button className="btn ghost sm" onClick={() => gate(cloud.locked, () => fileRef.current?.click(), 'Crie sua conta para importar um backup.')}>
            Importar
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        </div>
      </header>

      {cloud.cloudEnabled && !cloud.user && (
        <div id="authBar" className="on">
          <b>Modo demonstração</b>
          <span>Você está vendo dados de exemplo. Crie sua conta gratuita para registrar suas operações.</span>
          <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => openAuth('up')}>
            Criar conta
          </button>
          <button className="btn ghost sm" onClick={() => openAuth('in')}>
            Entrar
          </button>
        </div>
      )}
    </>
  );
}
