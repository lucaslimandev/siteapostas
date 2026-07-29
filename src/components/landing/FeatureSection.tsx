import type { ReactNode } from 'react';
import Reveal from './Reveal';

export default function FeatureSection({
  id,
  num,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  reverse,
}: {
  id: string;
  num: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className={'feature-section' + (reverse ? ' reverse' : '')}>
      <div className="feature-grid">
        <Reveal className="feature-copy">
          <span className="eyebrow">
            <span className="num">{num}</span> {eyebrow}
          </span>
          <h2>{title}</h2>
          <p>{description}</p>
          <ul className="feature-bullets">
            {bullets.map((b, i) => (
              <li key={i}>
                <i>✓</i>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={2} className="feature-visual">
          {visual}
        </Reveal>
      </div>
    </section>
  );
}
