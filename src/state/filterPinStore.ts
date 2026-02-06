import { create } from 'zustand';

export interface CoreFilters {
  layer: string;
  q: string;
  rel_type: string;
  date_from: string;
  date_to: string;
  entity_type: string;
  has_geo: 'any' | 'yes' | 'no';
}

export const DEFAULT_CORE_FILTERS: CoreFilters = {
  layer: 'canon',
  q: '',
  rel_type: '',
  date_from: '',
  date_to: '',
  entity_type: '',
  has_geo: 'any',
};

interface FilterPinState {
  pinned: boolean;
  pinnedFilters: CoreFilters;
  setPinned: (value: boolean) => void;
  setPinnedFilters: (filters: CoreFilters) => void;
  resetPinned: () => void;
}

export const useFilterPinStore = create<FilterPinState>((set) => ({
  pinned: false,
  pinnedFilters: DEFAULT_CORE_FILTERS,
  setPinned: (value) => set({ pinned: value }),
  setPinnedFilters: (filters) => set({ pinnedFilters: filters }),
  resetPinned: () => set({ pinned: false, pinnedFilters: DEFAULT_CORE_FILTERS }),
}));
