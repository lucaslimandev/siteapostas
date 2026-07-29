import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmWord,
  confirmLabel = 'Confirmar',
  busy,
  busyLabel = 'Aguarde...',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmWord: string;
  confirmLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  if (!open) return null;
  const match = value.trim() === confirmWord;

  return (
    <Modal open={open} onClose={onCancel}>
      <div className="dlg-head">
        <h3>{title}</h3>
      </div>
      <div className="dlg-body">
        <p className="hint" style={{ marginTop: 0 }}>
          {message}
        </p>
        <label className="field">
          <span>
            Digite <b style={{ color: 'var(--text)' }}>{confirmWord}</b> para confirmar
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={confirmWord}
            autoFocus
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && match && !busy) onConfirm();
            }}
          />
        </label>
      </div>
      <div className="dlg-foot">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="btn ghost danger" disabled={!match || busy} onClick={onConfirm}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
