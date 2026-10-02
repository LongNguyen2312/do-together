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
import { signUpWithEmail } from '@/services/auth';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';
import {
  COMPACT_HEIGHT,
  isValidEmail,
  isValidPassword,
  PASSWORD_MIN_LENGTH,
} from '@/utils/constants';

import { createStyles } from './styles';

const ENTER_MS = 520;
const STRONG_PASSWORD_LENGTH = 10;

const AVATARS = [
  require('@/assets/images/signup/avatar-1.jpg'),
  require('@/assets/images/signup/avatar-2.jpg'),
  require('@/assets/images/signup/avatar-3.jpg'),
];

type Strength = 0 | 1 | 2 | 3;

function getStrength(password: string): Strength {
  if (!password) {
    return 0;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 1;
  }
  return password.length < STRONG_PASSWORD_LENGTH ? 2 : 3;
}

interface SignUpErrors {
  fullName?: string;
  email?: string;
  password?: string;
  terms?: string;
}

type Field = 'fullName' | 'email' | 'password';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < COMPACT_HEIGHT;

  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    fullName: false,
    email: false,
    password: false,
  });
  const [loading, setLoading] = useState(false);

  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  const validateFields = (
    values = { fullName, email, password },
  ): SignUpErrors => {
    const nextErrors: SignUpErrors = {};
    const trimmedEmail = values.email.trim();

    if (!values.fullName.trim()) {
      nextErrors.fullName = t('auth.fullNameRequired');
    }

    if (!trimmedEmail) {
      nextErrors.email = t('auth.emailRequired');
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = t('auth.emailInvalid');
    }

    if (!values.password) {
      nextErrors.password = t('auth.passwordRequired');
    } else if (!isValidPassword(values.password)) {
      nextErrors.password = t('auth.passwordInvalid');
    }

    return nextErrors;
  };

  const onChangeField = (field: Field, value: string) => {
    const values = { fullName, email, password, [field]: value };
    if (field === 'fullName') {
      setFullName(value);
    } else if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    if (touched[field] || errors[field]) {
      const next = validateFields(values);
      setErrors(prev => ({ ...prev, [field]: next[field] }));
    }
  };

  const onBlurField = (field: Field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateFields()[field] }));
  };

  const onToggleTerms = () => {
    setAcceptedTerms(prev => !prev);
    setErrors(prev => ({ ...prev, terms: undefined }));
  };

  const onSignUp = async () => {
    Keyboard.dismiss();
    setTouched({ fullName: true, email: true, password: true });

    const fieldErrors = validateFields();
    if (!acceptedTerms) {
      fieldErrors.terms = t('auth.termsRequired');
    }
    if (Object.values(fieldErrors).some(Boolean)) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const profile = await signUpWithEmail(
        fullName.trim(),
        email.trim(),
        password,
      );
      dispatch(setUser(profile));
    } catch {
      setLoading(false);
      Alert.alert(t('auth.signUpErrorTitle'), t('auth.genericError'));
    }
  };

  const showComingSoon = () => {
    Keyboard.dismiss();
    Alert.alert(t('auth.comingSoonTitle'), t('auth.comingSoonMessage'));
  };

  const strength = getStrength(password);
  const strengthColor = [
    colors.textSecondary,
    colors.danger,
    colors.primary,
    colors.success,
  ][strength];
  const strengthLabel = [
    t('auth.strengthLabel'),
    t('auth.strengthWeak'),
    t('auth.strengthFair'),
    t('auth.strengthStrong'),
  ][strength];

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
        <Animated.View style={[styles.header, { opacity: intro }]}>
          <Pressable
            onPress={navigation.goBack}
            disabled={loading}
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
          <View style={styles.communityBadge}>
            <PulseDot color={colors.primary} />
            <Text style={styles.communityBadgeText}>
              {t('auth.communityBadge')}
            </Text>
          </View>
        </Animated.View>
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
            <Text style={styles.title}>{t('auth.signUpTitle')}</Text>
            {compact ? null : (
              <Text style={styles.subtitle}>{t('auth.signUpSubtitle')}</Text>
            )}

            {compact ? null : (
              <View style={styles.proofBanner}>
                <View style={styles.avatarStack}>
                  {AVATARS.map((source, i) => (
                    <Image
                      key={i}
                      source={source}
                      style={[styles.avatar, i > 0 && styles.avatarOverlap]}
                    />
                  ))}
                </View>
                <Text style={styles.proofText} numberOfLines={1}>
                  {t('auth.joinedThisWeek')}
                </Text>
                <Icon name="flash" size={ms(14)} color={colors.primary} />
              </View>
            )}

            <View style={[styles.form, compact && styles.formCompact]}>
              <FormField
                label={t('auth.fullName')}
                icon="person-outline"
                value={fullName}
                onChangeText={value => onChangeField('fullName', value)}
                placeholder={t('auth.fullNamePlaceholder')}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                submitBehavior="submit"
                error={errors.fullName}
                onBlur={() => onBlurField('fullName')}
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <FormField
                inputRef={emailRef}
                label={t('auth.email')}
                icon="mail-outline"
                value={email}
                onChangeText={value => onChangeField('email', value)}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                error={errors.email}
                onBlur={() => onBlurField('email')}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <FormField
                inputRef={passwordRef}
                label={t('auth.password')}
                icon="lock-closed-outline"
                value={password}
                onChangeText={value => onChangeField('password', value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                error={errors.password}
                onBlur={() => onBlurField('password')}
                onSubmitEditing={onSignUp}
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
                footer={
                  compact && !password ? null : (
                    <View style={styles.strength}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3].map(level => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              strength >= level && {
                                backgroundColor: strengthColor,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <View style={styles.strengthRow}>
                        <Text
                          style={[
                            styles.strengthText,
                            { color: strengthColor },
                          ]}
                        >
                          {strengthLabel}
                        </Text>
                        {strength === 3 ? (
                          <View style={styles.strengthMax}>
                            <Icon
                              name="shield-checkmark-outline"
                              size={ms(12)}
                              color={colors.success}
                            />
                            <Text
                              style={[
                                styles.strengthText,
                                { color: colors.success },
                              ]}
                            >
                              {t('auth.strengthMax')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )
                }
              />

              <View>
                <Pressable
                  style={styles.termsRow}
                  onPress={onToggleTerms}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      acceptedTerms && styles.checkboxChecked,
                      errors.terms ? styles.checkboxError : null,
                    ]}
                  >
                    {acceptedTerms ? (
                      <Icon
                        name="checkmark"
                        size={ms(14)}
                        color={colors.white}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.termsText}>
                    {t('auth.termsPrefix')}
                    <Text style={styles.termsLink} onPress={showComingSoon}>
                      {t('auth.termsOfService')}
                    </Text>
                    {t('auth.termsAnd')}
                    <Text style={styles.termsLink} onPress={showComingSoon}>
                      {t('auth.privacyPolicy')}
                    </Text>
                    {t('auth.termsSuffix')}
                  </Text>
                </Pressable>
                {errors.terms ? (
                  <Text style={styles.termsError}>{errors.terms}</Text>
                ) : null}
              </View>

              <PrimaryButton
                title={t('auth.createAccount')}
                trailingIcon="arrow-forward"
                onPress={onSignUp}
                loading={loading}
                style={styles.submit}
              />
            </View>

            <SocialAuthGroup
              dividerLabel={t('auth.orContinueWith')}
              googleLabel="Google"
              appleLabel="Apple"
              onGooglePress={showComingSoon}
              onApplePress={showComingSoon}
              disabled={loading}
              horizontal
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.haveAccount')}</Text>
              <Pressable
                onPress={navigation.goBack}
                hitSlop={8}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.footerLink}>{t('auth.signInLink')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
