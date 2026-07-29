import type { ReactNode } from 'react';

type ChipKind = 'on' | 'win' | 'loss' | 'warn' | undefined;

export default function Chip({ children, kind, style }: { children: ReactNode; kind?: ChipKind; style?: React.CSSProperties }) {
  return (
    <span className={'chip' + (kind ? ' ' + kind : '')} style={style}>
      {children}
    </span>
  );
}
