import { create } from 'zustand';
import type { Banca, Cycle, Method, Op } from '../lib/types';

interface OpDialogState {
  open: boolean;
  editingOp: Op | null;
  cycleId: string | null;
  openOpDialog: (op: Op | null, cycleId?: string | null) => void;
  close: () => void;
}

export const useOpDialogStore = create<OpDialogState>((set) => ({
  open: false,
  editingOp: null,
  cycleId: null,
  openOpDialog: (op, cycleId = null) => set({ open: true, editingOp: op, cycleId: op?.cycleId ?? cycleId }),
  close: () => set({ open: false, editingOp: null, cycleId: null }),
}));

interface DetailDialogState {
  open: boolean;
  opId: string | null;
  openDetail: (id: string) => void;
  close: () => void;
}

export const useDetailDialogStore = create<DetailDialogState>((set) => ({
  open: false,
  opId: null,
  openDetail: (id) => set({ open: true, opId: id }),
  close: () => set({ open: false, opId: null }),
}));

interface CycleDialogState {
  open: boolean;
  editingCycle: Cycle | null;
  openCycleDialog: (c: Cycle | null) => void;
  close: () => void;
}

export const useCycleDialogStore = create<CycleDialogState>((set) => ({
  open: false,
  editingCycle: null,
  openCycleDialog: (c) => set({ open: true, editingCycle: c }),
  close: () => set({ open: false, editingCycle: null }),
}));

interface MethodDialogState {
  open: boolean;
  editingMethod: Method | null;
  openMethodDialog: (m: Method | null) => void;
  close: () => void;
}

export const useMethodDialogStore = create<MethodDialogState>((set) => ({
  open: false,
  editingMethod: null,
  openMethodDialog: (m) => set({ open: true, editingMethod: m }),
  close: () => set({ open: false, editingMethod: null }),
}));

interface BancaDialogState {
  open: boolean;
  editingBanca: Banca | null;
  openBancaDialog: (b: Banca | null) => void;
  close: () => void;
}

export const useBancaDialogStore = create<BancaDialogState>((set) => ({
  open: false,
  editingBanca: null,
  openBancaDialog: (b) => set({ open: true, editingBanca: b }),
  close: () => set({ open: false, editingBanca: null }),
}));

interface AuthDialogState {
  open: boolean;
  mode: 'in' | 'up';
  message: string;
  openAuth: (mode?: 'in' | 'up', message?: string) => void;
  close: () => void;
}

export const useAuthDialogStore = create<AuthDialogState>((set) => ({
  open: false,
  mode: 'in',
  message: '',
  openAuth: (mode = 'in', message = '') => set({ open: true, mode, message }),
  close: () => set({ open: false, message: '' }),
}));

interface AccountDialogState {
  open: boolean;
  openAccount: () => void;
  close: () => void;
}

export const useAccountDialogStore = create<AccountDialogState>((set) => ({
  open: false,
  openAccount: () => set({ open: true }),
  close: () => set({ open: false }),
}));

/**
 * Portão de ações que exigem conta: quando a nuvem está ativa e ninguém está logado,
 * qualquer ação de escrita abre o convite para criar conta em vez de executar.
 */
export function gate(locked: boolean, fn: () => void, message = 'Crie sua conta para registrar e salvar suas operações.') {
  if (locked) {
    useAuthDialogStore.getState().openAuth('up', message);
    return;
  }
  fn();
}
