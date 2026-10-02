import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import { useTabBarInset } from '@/components/LiquidTabBar';
import { fonts, useTheme, type AppColors } from '@/theme';

interface TabPlaceholderProps {
  icon: string;
  title: string;
  message: string;
  children?: ReactNode;
}

/** Stand-in for tabs whose real screens have not been designed yet. */
export default function TabPlaceholder({
  icon,
  title,
  message,
  children,
}: TabPlaceholderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarInset = useTabBarInset();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.content, { paddingBottom: tabBarInset }]}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={ms(30)} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ms(32),
    },
    iconWrap: {
      width: ms(64),
      height: ms(64),
      borderRadius: ms(32),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    title: {
      marginTop: ms(16),
      fontSize: ms(20),
      lineHeight: ms(26),
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      marginTop: ms(6),
      fontSize: ms(14),
      fontFamily: fonts.regular,
      lineHeight: ms(20),
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
