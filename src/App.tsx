import { useEffect } from 'react';
import { useCloudSync } from './hooks/useCloudSync';
import { CloudProvider } from './hooks/useCloudContext';
import LoadingScreen from './components/common/LoadingScreen';
import AppShell from './components/layout/AppShell';

function hideBootSplash() {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('hide');
  setTimeout(() => boot.remove(), 400);
}

export default function App() {
  const cloud = useCloudSync();

  useEffect(() => {
    hideBootSplash();
  }, []);

  if (!cloud.authReady) {
    return <LoadingScreen label="Conectando" />;
  }

  return (
    <CloudProvider value={cloud}>
      <AppShell />
    </CloudProvider>
  );
}
