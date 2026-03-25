import { create } from 'zustand';

interface AppState {
  // User preferences
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Price data cache
  priceCache: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    updatedAt: number;
  }>;
  setPrice: (ticker: string, data: { price: number; change: number; changePercent: number }) => void;
  getPrice: (ticker: string) => { price: number; change: number; changePercent: number; updatedAt: number } | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  priceCache: {},

  setPrice: (ticker, data) =>
    set((state) => ({
      priceCache: {
        ...state.priceCache,
        [ticker]: {
          ...data,
          updatedAt: Date.now(),
        },
      },
    })),

  getPrice: (ticker) => {
    const cache = get().priceCache[ticker];
    // Cache expires after 5 minutes
    if (cache && Date.now() - cache.updatedAt < 5 * 60 * 1000) {
      return cache;
    }
    return null;
  },
}));
