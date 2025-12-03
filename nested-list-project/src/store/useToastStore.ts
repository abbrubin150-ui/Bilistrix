import { create } from 'zustand';
import { ToastMessage } from '../components/ui/Toast';
import { ToastType } from '../components/ui/Toast';

type ToastState = {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType) => string;
  dismissToast: (id: string) => void;
  clear: () => void;
};

const createToast = (message: string, type: ToastType = 'info'): ToastMessage => ({
  id: `${Date.now()}-${Math.random()}`,
  message,
  type,
});

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const toast = createToast(message, type);
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return toast.id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
