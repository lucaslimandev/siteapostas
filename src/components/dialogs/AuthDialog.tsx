import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAuthDialogStore } from '../../hooks/useDialogs';
import { useCloud } from '../../hooks/useCloudContext';
import { authErrorMessage } from '../../lib/authErrors';

export default function AuthDialog() {
  const { open, mode, message, close, openAuth } = useAuthDialogStore();
  const cloud = useCloud();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState<'info' | 'error' | 'success'>('info');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMsg(message);
      setMsgKind('info');
    }
  }, [open, message]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('Conectando...');
    setMsgKind('info');
    try {
      if (mode === 'in') await cloud.signIn(email.trim(), pass);
      else await cloud.signUp(email.trim(), pass);
      close();
      setMsg('');
    } catch (err) {
      setMsg(authErrorMessage(err));
      setMsgKind('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setMsg('Digite seu e-mail primeiro.');
      setMsgKind('error');
      return;
    }
    try {
      await cloud.resetPassword(email.trim());
      setMsg('Enviei um link de redefinição para seu e-mail.');
      setMsgKind('success');
    } catch (err) {
      setMsg(authErrorMessage(err));
      setMsgKind('error');
    }
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={handleSubmit}>
        <div className="dlg-head">
          <h3>{mode === 'in' ? 'Entrar na sua conta' : 'Criar sua conta'}</h3>
        </div>
        <div className="dlg-body">
          <div className="seg">
            <button type="button" aria-pressed={mode === 'in'} onClick={() => openAuth('in')}>
              Entrar
            </button>
            <button type="button" aria-pressed={mode === 'up'} onClick={() => openAuth('up')}>
              Criar conta
            </button>
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            {mode === 'in' ? 'Seus dados sincronizam entre celular e computador.' : 'Basta e-mail e senha. O banco de dados da sua conta é criado automaticamente.'}
          </p>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="voce@email.com" />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              placeholder="mínimo 6 caracteres"
            />
          </label>
          {msg && (
            <div className="hint" style={{ margin: 0, color: msgKind === 'error' ? 'var(--coral)' : msgKind === 'success' ? 'var(--mint)' : 'var(--amber)' }}>
              {msg}
            </div>
          )}
        </div>
        <div className="dlg-foot">
          <button type="button" className="btn ghost sm" onClick={handleReset}>
            Esqueci a senha
          </button>
          <button type="button" className="btn ghost" onClick={close}>
            Fechar
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {mode === 'in' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
