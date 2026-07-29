import { createContext, useContext, type ReactNode } from 'react';
import type { CloudSync } from './useCloudSync';

const CloudContext = createContext<CloudSync | null>(null);

export function CloudProvider({ value, children }: { value: CloudSync; children: ReactNode }) {
  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud(): CloudSync {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error('useCloud deve ser usado dentro de <CloudProvider>');
  return ctx;
}
