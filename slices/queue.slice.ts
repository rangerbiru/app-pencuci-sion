import { useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { State } from '@/utils/store';
import type { QueueItem } from '@/services/queue/types';

export interface QueueState {
  items: QueueItem[];
}

const initialState: QueueState = { items: [] };

const slice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueueItems: (state, { payload }: PayloadAction<QueueItem[]>) => {
      state.items = payload;
    },
  },
});

export const { setQueueItems } = slice.actions;

/** Item antrean yang belum terkirim (menunggu atau gagal). */
export function useQueueItems() {
  return useSelector(({ queue }: State) => queue.items);
}

export default slice.reducer;
