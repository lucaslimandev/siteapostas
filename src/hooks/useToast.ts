import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (message) => {
    set({ message, visible: true });
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => set({ visible: false }), 2200);
  },
}));

export const toast = (msg: string) => useToastStore.getState().show(msg);
