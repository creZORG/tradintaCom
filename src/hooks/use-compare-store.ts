
'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ProductIdentifier {
  id: string;
  name: string;
  imageUrl?: string;
}

interface CompareState {
  items: ProductIdentifier[];
  addItem: (item: ProductIdentifier) => void;
  removeItem: (itemId: string) => void;
  toggleItem: (item: ProductIdentifier) => void;
  clear: () => void;
}

const MAX_COMPARE_ITEMS = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        if (currentItems.length < MAX_COMPARE_ITEMS && !currentItems.some(i => i.id === item.id)) {
          set({ items: [...currentItems, item] });
        }
      },
      removeItem: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
      },
      toggleItem: (item) => {
        const currentItems = get().items;
        const itemExists = currentItems.some(i => i.id === item.id);

        if (itemExists) {
          set({ items: currentItems.filter((i) => i.id !== item.id) });
        } else if (currentItems.length < MAX_COMPARE_ITEMS) {
          set({ items: [...currentItems, item] });
        }
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'tradinta-compare-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
