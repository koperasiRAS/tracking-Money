import { create } from 'zustand';
import type { PortfolioItem } from '@/types';

interface PortfolioState {
  items: PortfolioItem[];
  isLoading: boolean;
  error: string | null;
  setItems: (items: PortfolioItem[]) => void;
  addItem: (item: PortfolioItem) => void;
  updateItem: (id: string, updates: Partial<PortfolioItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => ({
      items: [item, ...state.items],
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
