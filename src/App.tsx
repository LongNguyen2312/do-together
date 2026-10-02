import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { useI18nSync } from '@/hooks/useI18nSync';
import RootNavigator from '@/navigators/RootNavigator';
import SplashScreen, { SPLASH_BACKGROUND } from '@/screens/Splash';
import { persistor, store } from '@/store';
import { resetOnboarding } from '@/store/slices/appSlice';
import { clearUser } from '@/store/slices/authSlice';
import { ThemeProvider } from '@/theme';
import { FORCE_ONBOARDING } from '@/utils/constants';
import '@/translations';

function AppShell() {
  useI18nSync();

  return <RootNavigator />;
}

/**
 * Native splash paints the same flat cream, so the JS splash mounts before
 * rehydrate finishes — icon tap to wordmark reads as one continuous screen.
 */
function BootGate() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  const onIntroFinished = useCallback(() => setIntroDone(true), []);
  const onSplashDismissed = useCallback(() => setSplashGone(true), []);

  const dismiss = bootstrapped && introDone;

  return (
    <View style={styles.root}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={() => {
          if (FORCE_ONBOARDING) {
            store.dispatch(resetOnboarding());
            store.dispatch(clearUser());
          }
          setBootstrapped(true);
        }}
      >
        <ThemeProvider>{bootstrapped ? <AppShell /> : null}</ThemeProvider>
      </PersistGate>

      {splashGone ? null : (
        <View style={styles.splashOverlay} pointerEvents="auto">
          {/*
            Mounted after ThemeProvider so dark mode can't flip the bar to
            light-content and hide the icons against the cream canvas.
          */}
          <StatusBar barStyle="dark-content" animated={false} />
          <SplashScreen
            dismiss={dismiss}
            onFinished={onIntroFinished}
            onDismissed={onSplashDismissed}
          />
        </View>
      )}
    </View>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <BootGate />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    backgroundColor: SPLASH_BACKGROUND,
  },
});

export default App;
