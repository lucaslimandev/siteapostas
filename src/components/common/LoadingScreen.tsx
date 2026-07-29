import Logo from './Logo';

export default function LoadingScreen({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="loading-screen">
      <Logo size={72} animated className="mark" />
      <span className="label">{label}</span>
    </div>
  );
}
