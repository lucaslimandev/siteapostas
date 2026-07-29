import { useActiveSection } from '../../hooks/useScrollReveal';

const SECTIONS = [
  { id: 'hero', label: 'Início' },
  { id: 'painel', label: 'Painel' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'ciclos', label: 'Ciclos' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'metodos', label: 'Métodos' },
  { id: 'cadastros', label: 'Cadastros' },
  { id: 'comecar', label: 'Começar' },
];

export default function DotNav() {
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  return (
    <nav className="dot-nav" aria-label="Seções da apresentação">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          className={active === s.id ? 'on' : ''}
          aria-label={s.label}
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <span className="tip">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
