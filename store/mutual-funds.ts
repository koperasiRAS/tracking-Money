import { create } from 'zustand';
import type { MutualFund } from '@/types';

interface MutualFundsState {
  funds: MutualFund[];
  isLoading: boolean;
  error: string | null;
  setFunds: (funds: MutualFund[]) => void;
  addFund: (fund: MutualFund) => void;
  updateFund: (id: string, updates: Partial<MutualFund>) => void;
  removeFund: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMutualFundsStore = create<MutualFundsState>((set) => ({
  funds: [],
  isLoading: false,
  error: null,

  setFunds: (funds) => set({ funds }),

  addFund: (fund) =>
    set((state) => ({
      funds: [fund, ...state.funds],
    })),

  updateFund: (id, updates) =>
    set((state) => ({
      funds: state.funds.map((fund) =>
        fund.id === id ? { ...fund, ...updates } : fund
      ),
    })),

  removeFund: (id) =>
    set((state) => ({
      funds: state.funds.filter((fund) => fund.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
