import { create } from 'zustand';
import type { Period } from '../lib/types';

export type View = 'dash' | 'ops' | 'cycles' | 'cycle' | 'reports' | 'calendar' | 'methods' | 'registry';

interface UiState {
  view: View;
  currentCycle: string | null;
  dashPeriod: Period;
  dashSeries: 'both' | 'bars' | 'line';
  repPeriod: string;
  calYear: number;
  calMonth: number;
  calSel: string | null;

  showView: (v: View) => void;
  openCycle: (id: string) => void;
  setDashPeriod: (p: Period) => void;
  setDashSeries: (s: 'both' | 'bars' | 'line') => void;
  setRepPeriod: (p: string) => void;
  calShift: (delta: number) => void;
  setCalSel: (day: string | null) => void;
}

const now = new Date();

export const useUiStore = create<UiState>((set, get) => ({
  view: 'dash',
  currentCycle: null,
  dashPeriod: 'day',
  dashSeries: 'both',
  repPeriod: 'all',
  calYear: now.getFullYear(),
  calMonth: now.getMonth(),
  calSel: null,

  showView: (v) => {
    set({ view: v });
    window.scrollTo({ top: 0 });
  },
  openCycle: (id) => {
    set({ currentCycle: id, view: 'cycle' });
    window.scrollTo({ top: 0 });
  },
  setDashPeriod: (p) => set({ dashPeriod: p }),
  setDashSeries: (s) => set({ dashSeries: s }),
  setRepPeriod: (p) => set({ repPeriod: p }),
  calShift: (delta) => {
    const { calYear, calMonth } = get();
    const d = new Date(calYear, calMonth + delta, 1);
    set({ calYear: d.getFullYear(), calMonth: d.getMonth() });
  },
  setCalSel: (day) => set((s) => ({ calSel: s.calSel === day ? null : day })),
}));
