import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';

import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';

const appPersistConfig = {
  key: 'app',
  storage: AsyncStorage,
  whitelist: ['language', 'themeMode', 'hasCompletedOnboarding', 'mapStyle'],
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['isAuthenticated', 'user'],
};

const rootReducer = combineReducers({
  app: persistReducer(appPersistConfig, appReducer),
  auth: persistReducer(authPersistConfig, authReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
