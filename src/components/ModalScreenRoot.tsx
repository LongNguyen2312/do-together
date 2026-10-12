import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ConfirmProvider } from '@/components/ConfirmDialog';

/**
 * Native stack modals open in their own view controller, outside the app's
 * root views: gestures need a GestureHandlerRootView inside the modal, and a
 * confirm dialog has to be presented from it (iOS won't present one from the
 * screen underneath while the modal is up).
 */
export function withModalRoots<P extends object>(Screen: ComponentType<P>) {
  function ModalScreen(props: P) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <ConfirmProvider>
          <Screen {...props} />
        </ConfirmProvider>
      </GestureHandlerRootView>
    );
  }
  ModalScreen.displayName = `withModalRoots(${
    Screen.displayName ?? Screen.name
  })`;
  return ModalScreen;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
