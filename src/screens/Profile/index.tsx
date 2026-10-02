import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';

import TabPlaceholder from '@/components/TabPlaceholder';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { fonts, useTheme, type AppColors } from '@/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAppSelector(state => state.auth.user);

  return (
    <TabPlaceholder
      icon="person-circle-outline"
      title={user?.displayName ?? t('tabs.profile')}
      message={user?.email ?? ''}
    >
      <Pressable
        onPress={() => dispatch(clearUser())}
        hitSlop={8}
        style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.logOutText}>{t('home.logOut')}</Text>
      </Pressable>
    </TabPlaceholder>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    logOut: {
      marginTop: ms(24),
      paddingHorizontal: ms(20),
      paddingVertical: ms(10),
      borderRadius: ms(999),
      backgroundColor: colors.surfaceMuted,
    },
    pressed: {
      opacity: 0.8,
    },
    logOutText: {
      fontSize: ms(14),
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
  });
}
