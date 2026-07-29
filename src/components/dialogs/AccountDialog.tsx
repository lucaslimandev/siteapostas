import { useState } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAccountDialogStore } from '../../hooks/useDialogs';
import { useCloud } from '../../hooks/useCloudContext';
import { useDbStore } from '../../hooks/useDbStore';
import { toast } from '../../hooks/useToast';

export default function AccountDialog() {
  const { open, close } = useAccountDialogStore();
  const cloud = useCloud();
  const db = useDbStore((s) => s.db);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!open || !cloud.user) return null;

  async function handleSignOut() {
    close();
    await cloud.signOutUser();
  }

  async function handleConfirmReset() {
    setResetting(true);
    try {
      await cloud.resetAccount();
      setConfirmOpen(false);
      close();
      toast('Conta reiniciada do zero');
    } catch {
      toast('Não consegui reiniciar a conta — tente de novo.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={close}>
        <div className="dlg-head">
          <h3>Sua conta</h3>
        </div>
        <div className="dlg-body">
          <dl className="kv">
            <dt>E-mail</dt>
            <dd>{cloud.user.email}</dd>
            <dt>Situação</dt>
            <dd>
              <span className="chip win">dados na nuvem</span>
            </dd>
            <dt>Guardado</dt>
            <dd className="mono">
              {db.ops.length} operações · {db.cycles.length} ciclos · {db.bancas.length} banca(s)
            </dd>
            <dt>Sincronia</dt>
            <dd>Automática. Funciona offline e envia quando a conexão volta.</dd>
          </dl>
          <p className="hint" style={{ margin: '14px 0 0' }}>
            Use <b>Exportar</b> na barra do topo para guardar um backup em arquivo.
          </p>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: '10.5px', letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--coral)', marginBottom: 8 }}>Zona de risco</div>
            <p className="hint" style={{ marginBottom: 12 }}>
              Reiniciar a conta apaga todas as bancas, operações, ciclos e métodos — na nuvem e neste navegador — e mostra o tutorial de novo, como se fosse a primeira vez.
            </p>
            <button type="button" className="btn ghost danger" onClick={() => setConfirmOpen(true)}>
              Reiniciar conta do zero
            </button>
          </div>
        </div>
        <div className="dlg-foot">
          <button className="btn ghost danger" onClick={handleSignOut}>
            Sair da conta
          </button>
          <button className="btn ghost" onClick={close}>
            Fechar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Reiniciar conta do zero"
        message='Isso apaga PERMANENTEMENTE todas as bancas, operações, ciclos e métodos desta conta, na nuvem e neste navegador. Não tem como desfazer.'
        confirmWord="REINICIAR"
        confirmLabel="Reiniciar tudo"
        busy={resetting}
        busyLabel="Apagando tudo..."
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
