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

import activityReducer from './slices/activitySlice';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import broadcastReducer from './slices/broadcastSlice';
import chatReducer from './slices/chatSlice';
import storyReducer from './slices/storySlice';

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

const broadcastPersistConfig = {
  key: 'broadcast',
  storage: AsyncStorage,
  whitelist: ['customActivities'],
};

// Threads stay in memory: seeded messages are timed from app start.
const chatPersistConfig = {
  key: 'chat',
  storage: AsyncStorage,
  whitelist: ['mutedIds'],
};

// Picked photos live in a temp folder, so only what was seen survives a restart.
const storyPersistConfig = {
  key: 'story',
  storage: AsyncStorage,
  whitelist: ['seenIds'],
};

const activityPersistConfig = {
  // Restored ids must exist in the mock activities: bump when they change.
  key: 'activity-v3',
  storage: AsyncStorage,
  whitelist: [
    'joinedIds',
    'checkedInIds',
    'joinedCommunityIds',
    'followedUserIds',
    'friendRequestIds',
  ],
};

const rootReducer = combineReducers({
  activity: persistReducer(activityPersistConfig, activityReducer),
  app: persistReducer(appPersistConfig, appReducer),
  auth: persistReducer(authPersistConfig, authReducer),
  broadcast: persistReducer(broadcastPersistConfig, broadcastReducer),
  chat: persistReducer(chatPersistConfig, chatReducer),
  story: persistReducer(storyPersistConfig, storyReducer),
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
