import type { ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function Reveal({ children, delay, className = '' }: { children: ReactNode; delay?: 1 | 2 | 3; className?: string }) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal${delay ? ' d' + delay : ''}${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}
