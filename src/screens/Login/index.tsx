import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type TextInputInstance,
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
import SocialAuthGroup from '@/components/SocialAuthGroup';
import SoftGlow from '@/components/SoftGlow';
import { MatchHero } from '@/screens/Onboarding/heroes';
import { createStyles as createHeroStyles } from '@/screens/Onboarding/styles';
import { loginWithEmail } from '@/services/auth';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import {
  COMPACT_HEIGHT,
  isValidEmail,
  isValidPassword,
  MAX_CONTENT_WIDTH,
} from '@/utils/constants';
import {
  clearRememberedEmail,
  getRememberedEmail,
  setRememberedEmail,
} from '@/utils/rememberedEmail';

import { createStyles, SCREEN_PADDING } from './styles';

const ENTER_MS = 520;
interface LoginErrors {
  email?: string;
  password?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroStyles = useMemo(() => createHeroStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const { width, height } = useWindowDimensions();
  const compact = height < COMPACT_HEIGHT;
  const cardWidth = Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_PADDING * 2;
  const cardHeight = Math.min(cardWidth * 0.44, ms(180));

  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  useEffect(() => {
    let active = true;
    getRememberedEmail().then(savedEmail => {
      if (active && savedEmail) {
        setEmail(savedEmail);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const validateFields = (nextEmail = email, nextPassword = password) => {
    const nextErrors: LoginErrors = {};
    const trimmedEmail = nextEmail.trim();

    if (!trimmedEmail) {
      nextErrors.email = t('auth.emailRequired');
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = t('auth.emailInvalid');
    }

    if (!nextPassword) {
      nextErrors.password = t('auth.passwordRequired');
    } else if (!isValidPassword(nextPassword)) {
      nextErrors.password = t('auth.passwordInvalid');
    }

    return nextErrors;
  };

  const onChangeEmail = (value: string) => {
    setEmail(value);
    if (touched.email || errors.email) {
      const next = validateFields(value, password);
      setErrors(prev => ({ ...prev, email: next.email }));
    }
  };

  const onChangePassword = (value: string) => {
    setPassword(value);
    if (touched.password || errors.password) {
      const next = validateFields(email, value);
      setErrors(prev => ({ ...prev, password: next.password }));
    }
  };

  const onLogin = async () => {
    Keyboard.dismiss();
    setTouched({ email: true, password: true });

    const fieldErrors = validateFields();
    if (fieldErrors.email || fieldErrors.password) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const profile = await loginWithEmail(trimmedEmail, password);
      if (rememberMe) {
        await setRememberedEmail(trimmedEmail);
      } else {
        await clearRememberedEmail();
      }
      dispatch(setUser(profile));
    } catch {
      setLoading(false);
      Alert.alert(t('auth.loginErrorTitle'), t('auth.genericError'));
    }
  };

  const showComingSoon = () => {
    Keyboard.dismiss();
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  };

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
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/logo-mark.png')}
                style={styles.brandLogo}
                tintColor={colors.primary}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>{t('auth.signIn')}</Text>
            </View>

            {compact ? null : (
              <View style={[styles.cardShadow, { height: cardHeight }]}>
                <View style={styles.card}>
                  <SoftGlow
                    color={colors.primary}
                    size={ms(176)}
                    maxOpacity={0.14}
                    style={{ top: -ms(40), right: -ms(40) }}
                  />
                  <SoftGlow
                    color={colors.surfaceHigh}
                    size={ms(160)}
                    maxOpacity={0.9}
                    style={{ bottom: -ms(32), left: -ms(32) }}
                  />
                  <MatchHero
                    styles={heroStyles}
                    width={cardWidth}
                    height={cardHeight}
                    wide
                  />
                  <View style={styles.badge}>
                    <PulseDot color={colors.primary} />
                    <Text style={styles.badgeText}>
                      {t('onboarding.slide3.badge')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.form, compact && styles.formCompact]}>
              <FormField
                label={t('auth.email')}
                icon="at"
                value={email}
                onChangeText={onChangeEmail}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                error={errors.email}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, email: true }));
                  setErrors(prev => ({
                    ...prev,
                    email: validateFields().email,
                  }));
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <FormField
                inputRef={passwordRef}
                label={t('auth.password')}
                icon="lock-closed-outline"
                value={password}
                onChangeText={onChangePassword}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                error={errors.password}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }));
                  setErrors(prev => ({
                    ...prev,
                    password: validateFields().password,
                  }));
                }}
                onSubmitEditing={onLogin}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword(prev => !prev)}
                    hitSlop={4}
                    style={styles.inputAction}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword
                        ? t('auth.hidePassword')
                        : t('auth.showPassword')
                    }
                  >
                    <Icon
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={ms(20)}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                }
              />

              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(prev => !prev)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe ? (
                      <Icon
                        name="checkmark"
                        size={ms(14)}
                        color={colors.white}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.rememberText}>
                    {t('auth.rememberMe')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={8}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotText}>
                    {t('auth.forgotPassword')}
                  </Text>
                </Pressable>
              </View>

              <PrimaryButton
                title={t('auth.login')}
                trailingIcon="arrow-forward"
                onPress={onLogin}
                loading={loading}
                style={styles.submit}
              />
            </View>

            <SocialAuthGroup
              dividerLabel={t('auth.orContinueWith')}
              googleLabel={t('auth.continueGoogle')}
              appleLabel={t('auth.continueApple')}
              onGooglePress={showComingSoon}
              onApplePress={showComingSoon}
              disabled={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
              <Pressable
                onPress={() => navigation.navigate('SignUp')}
                hitSlop={8}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
