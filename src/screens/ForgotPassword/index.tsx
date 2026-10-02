import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import FormField from '@/components/FormField';
import PrimaryButton from '@/components/PrimaryButton';
import PulseDot from '@/components/PulseDot';
import SoftGlow from '@/components/SoftGlow';
import { requestPasswordReset } from '@/services/auth';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import { COMPACT_HEIGHT, isValidEmail } from '@/utils/constants';

import { createStyles } from './styles';

const ENTER_MS = 520;
const COMMUNITY_AVATARS = ['SG', 'HN', '+8k'] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < COMPACT_HEIGHT;

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t('auth.emailRequired');
    }
    return isValidEmail(trimmed) ? undefined : t('auth.emailInvalid');
  };

  const onChangeEmail = (value: string) => {
    setEmail(value);
    setSent(false);
    if (error) {
      setError(validate(value));
    }
  };

  const onSubmit = async () => {
    Keyboard.dismiss();
    const nextError = validate(email);
    setError(nextError);
    if (nextError) {
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      Alert.alert(t('forgotPassword.errorTitle'), t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const showComingSoon = () => {
    Keyboard.dismiss();
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  };

  const avatarColors = [
    { backgroundColor: colors.primarySoft, color: colors.primaryDark },
    { backgroundColor: colors.mint, color: colors.success },
    { backgroundColor: colors.surfaceHigh, color: colors.textSecondary },
  ];

  const introStyle = {
    opacity: intro,
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [ms(16), 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={navigation.goBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('auth.back')}
          >
            <Icon name="arrow-back" size={ms(18)} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, introStyle]}>
            <View style={styles.heroCard}>
              <SoftGlow
                color={colors.primary}
                size={ms(150)}
                maxOpacity={0.14}
                style={{ top: -ms(40), right: -ms(40) }}
              />
              <SoftGlow
                color={colors.mint}
                size={ms(120)}
                maxOpacity={0.35}
                style={{ bottom: -ms(32), left: -ms(32) }}
              />
              {compact ? null : (
                <View style={styles.lockRing}>
                  <View style={styles.lockInner}>
                    <Icon
                      name="lock-closed"
                      size={ms(28)}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.keyBadge}>
                    <Icon name="key" size={ms(11)} color={colors.white} />
                  </View>
                </View>
              )}
              <View style={styles.badge}>
                <PulseDot color={colors.primary} />
                <Text style={styles.badgeText}>
                  {t('forgotPassword.badge')}
                </Text>
              </View>
              <Text style={styles.title}>{t('forgotPassword.title')}</Text>
              <Text style={styles.description}>
                {t('forgotPassword.description')}
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.infoStrip}>
                <View style={styles.infoIcon}>
                  <Icon
                    name="shield-checkmark-outline"
                    size={ms(16)}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.infoText}>
                  {t('forgotPassword.codeInfo')}
                </Text>
              </View>

              <FormField
                label={t('forgotPassword.emailLabel')}
                labelAccessory={
                  <Text style={styles.required}>
                    {t('forgotPassword.required')}
                  </Text>
                }
                icon="mail-outline"
                value={email}
                onChangeText={onChangeEmail}
                placeholder={t('forgotPassword.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                error={error}
                onSubmitEditing={onSubmit}
                trailing={
                  email ? (
                    <Pressable
                      onPress={() => onChangeEmail('')}
                      hitSlop={8}
                      style={styles.clearButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('forgotPassword.clearEmail')}
                    >
                      <Icon
                        name="close"
                        size={ms(14)}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ) : null
                }
                footer={
                  <Text style={styles.hint}>
                    {t('forgotPassword.emailHint')}
                  </Text>
                }
              />

              <PrimaryButton
                title={t('forgotPassword.sendCode')}
                leadingIcon="send"
                onPress={onSubmit}
                loading={loading}
              />
            </View>

            {sent ? (
              <View
                style={styles.successBanner}
                accessibilityLiveRegion="polite"
              >
                <Icon
                  name="checkmark-circle"
                  size={ms(22)}
                  color={colors.success}
                />
                <View style={styles.flex}>
                  <Text style={styles.successTitle}>
                    {t('forgotPassword.sentTitle')}
                  </Text>
                  <Text style={styles.successText}>
                    {t('forgotPassword.sentMessage')}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.footer}>
              {compact ? null : (
                <View style={styles.communityCard}>
                  <View style={styles.avatarStack}>
                    {COMMUNITY_AVATARS.map((initials, i) => (
                      <View
                        key={initials}
                        style={[
                          styles.avatar,
                          i > 0 && styles.avatarOverlap,
                          { backgroundColor: avatarColors[i].backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            { color: avatarColors[i].color },
                          ]}
                        >
                          {initials}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.communityTitle} numberOfLines={1}>
                      {t('forgotPassword.communityTitle')}
                    </Text>
                    <Text style={styles.communitySubtitle} numberOfLines={1}>
                      {t('forgotPassword.communitySubtitle')}
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.noAccess}>
                {t('forgotPassword.noAccess')}
              </Text>
              <Pressable
                onPress={showComingSoon}
                hitSlop={8}
                style={styles.supportRow}
                accessibilityRole="button"
              >
                <Icon
                  name="headset-outline"
                  size={ms(14)}
                  color={colors.primaryDark}
                />
                <Text style={styles.supportText}>
                  {t('forgotPassword.contactSupport')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
