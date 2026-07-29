type LogoProps = {
  size?: number;
  animated?: boolean;
  className?: string;
};

/** Monograma da marca: três barras ascendentes em gradiente âmbar → menta. */
export default function Logo({ size = 34, animated = false, className }: LogoProps) {
  const gradId = 'banca-logo-g';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Banca"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--amber)" />
          <stop offset="1" stopColor="var(--mint)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="18" fill="var(--surface)" stroke="var(--line)" />
      <g fill={`url(#${gradId})`}>
        <rect className={animated ? 'bar bar1' : undefined} x="16" y="30" width="9" height="20" rx="2.5" />
        <rect className={animated ? 'bar bar2' : undefined} x="27.5" y="20" width="9" height="30" rx="2.5" />
        <rect className={animated ? 'bar bar3' : undefined} x="39" y="12" width="9" height="38" rx="2.5" />
      </g>
    </svg>
  );
}
