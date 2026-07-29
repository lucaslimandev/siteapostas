import { useEffect, useState } from 'react';
import Logo from '../common/Logo';
import { TUTORIAL_STEPS } from './steps';
import { useUiStore } from '../../hooks/useUiStore';

export default function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [i, setI] = useState(0);
  const showView = useUiStore((s) => s.showView);
  const step = TUTORIAL_STEPS[i];
  const last = i === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    showView(step.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div className="tutorial-dock">
      <div className="tutorial-panel" role="dialog" aria-label="Tutorial guiado" key={step.id}>
        <div className="tutorial-panel-head">
          <Logo size={20} />
          <span className="step-count">
            Passo {i + 1} de {TUTORIAL_STEPS.length}
          </span>
          <button className="btn ghost sm tutorial-skip" onClick={onFinish}>
            Pular tutorial
          </button>
        </div>

        <div className="tutorial-panel-body">
          <span className="eyebrow">{step.eyebrow}</span>
          <h2>{step.title}</h2>
          {step.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
          {step.bullets.length > 0 && (
            <ul className="tutorial-bullets">
              {step.bullets.map((b, idx) => (
                <li key={idx}>
                  <i>✓</i>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="tutorial-panel-foot">
          <div className="tutorial-dots">
            {TUTORIAL_STEPS.map((s, idx) => (
              <i key={s.id} className={idx === i ? 'on' : ''} />
            ))}
          </div>
          <div className="tutorial-actions">
            {i > 0 && (
              <button className="btn ghost" onClick={() => setI((x) => Math.max(0, x - 1))}>
                Voltar
              </button>
            )}
            <button className="btn primary" onClick={() => (last ? onFinish() : setI((x) => Math.min(TUTORIAL_STEPS.length - 1, x + 1)))}>
              {last ? 'Concluir' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
