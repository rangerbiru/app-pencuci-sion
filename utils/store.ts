import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import app from '@/slices/app.slice';
import queue from '@/slices/queue.slice';
import { api } from '@/services/api/api';
import config from '@/utils/config';
import { Env } from '@/types/env';

const isDev = config.env === Env.dev && __DEV__ && process.env.NODE_ENV !== 'test';

// redux-logger hanya dipasang saat development; build lain tidak mencatat state ke konsol
const devMiddlewares: Middleware[] = isDev ? [logger as Middleware] : [];

export function makeStore() {
  return configureStore({
    reducer: {
      app,
      queue,
      [api.reducerPath]: api.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false })
        .concat(api.middleware)
        .concat(devMiddlewares),
    devTools: isDev,
  });
}

const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type State = ReturnType<AppStore['getState']>;
export type Dispatch = AppStore['dispatch'];

export default store;
