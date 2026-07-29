import { create } from 'zustand';

interface LandingState {
  show: boolean;
  enter: () => void;
}

/** Só em memória — nada é salvo no navegador, então a landing volta a aparecer a cada nova visita. */
export const useLandingStore = create<LandingState>((set) => ({
  show: true,
  enter: () => set({ show: false }),
}));
