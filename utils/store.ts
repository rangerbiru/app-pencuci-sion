import { configureStore, Middleware } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import config from '@/utils/config';
import { Env } from '@/types/env';
import logger from 'redux-logger';

const isDev = config.env === Env.dev && __DEV__;

// redux-logger hanya dipasang saat development; build lain tidak mencatat state ke konsol
const devMiddlewares: Middleware[] = isDev ? [logger as Middleware] : [];

const store = configureStore({
  reducer: {
    app,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(devMiddlewares),
  devTools: isDev,
});

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

export default store;
