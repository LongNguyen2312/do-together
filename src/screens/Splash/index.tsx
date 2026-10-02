import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { hideSplash } from 'react-native-splash-view';
import { ms } from 'react-native-size-matters';

import SoftGlow from '@/components/SoftGlow';

import { SPLASH_ACCENT, SPLASH_GLOW_SOFT, styles } from './styles';

export { SPLASH_BACKGROUND } from './styles';

const BRAND = 'DoTogether';
/** "Do" stays warm brown, "Together" picks up the brand orange. */
const ACCENT_INDEX = 2;

const LOGO_IN_MS = 620;
const LETTER_DELAY_MS = 260;
const LETTER_STAGGER_MS = 45;
const LETTER_IN_MS = 420;
const TAGLINE_DELAY_MS = 720;
const TAGLINE_IN_MS = 480;
const GLOW_IN_MS = 900;
const HOLD_MS = 420;

/** Full entrance + short hold before the app may dismiss the splash. */
export const SPLASH_ANIMATION_MS =
  Math.max(
    LETTER_DELAY_MS + (BRAND.length - 1) * LETTER_STAGGER_MS + LETTER_IN_MS,
    TAGLINE_DELAY_MS + TAGLINE_IN_MS,
  ) + HOLD_MS;

/** Safety net if requestAnimationFrame never runs (e.g. launched in background). */
const HANDOFF_FALLBACK_MS = 400;

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

interface SplashScreenProps {
  onFinished?: () => void;
  dismiss?: boolean;
  onDismissed?: () => void;
}

interface LetterAnim {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

function AnimatedLetter({
  char,
  accent,
  anim,
}: {
  char: string;
  accent: boolean;
  anim: LetterAnim;
}) {
  return (
    <Animated.Text
      style={[
        styles.letter,
        accent ? styles.letterAccent : null,
        {
          opacity: anim.opacity,
          transform: [{ translateY: anim.translateY }],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

export default function SplashScreen({
  onFinished,
  onDismissed,
  dismiss = false,
}: SplashScreenProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const letters = useRef(BRAND.split('')).current;
  const letterAnims = useRef<LetterAnim[]>(
    letters.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(ms(12)),
    })),
  ).current;

  const glow = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const dismissingRef = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  /**
   * Drop the native splash only once this canvas has painted, then start the
   * intro in the same tick. Both layers share the same flat cream, so the
   * handoff is invisible and the animation always plays from its first frame.
   */
  const beginIntro = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    hideSplash();

    const fadeUp = (value: Animated.Value, duration: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: EASE_OUT,
        useNativeDriver: true,
      });

    Animated.parallel([
      fadeUp(glow, GLOW_IN_MS),
      fadeUp(logo, LOGO_IN_MS),
      Animated.sequence([
        Animated.delay(LETTER_DELAY_MS),
        Animated.stagger(
          LETTER_STAGGER_MS,
          letterAnims.map(anim =>
            Animated.parallel([
              fadeUp(anim.opacity, LETTER_IN_MS),
              Animated.timing(anim.translateY, {
                toValue: 0,
                duration: LETTER_IN_MS,
                easing: EASE_OUT,
                useNativeDriver: true,
              }),
            ]),
          ),
        ),
      ]),
      Animated.sequence([
        Animated.delay(TAGLINE_DELAY_MS),
        fadeUp(tagline, TAGLINE_IN_MS),
      ]),
    ]).start();

    doneTimerRef.current = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinishedRef.current?.();
      }
    }, SPLASH_ANIMATION_MS);
  }, [glow, letterAnims, logo, tagline]);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(beginIntro);
    });
    const fallback = setTimeout(beginIntro, HANDOFF_FALLBACK_MS);

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      clearTimeout(fallback);
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
      }
    };
  }, [beginIntro]);

  useEffect(() => {
    if (!dismiss || dismissingRef.current) {
      return;
    }
    dismissingRef.current = true;

    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.06,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismissed?.();
      }
    });
  }, [dismiss, exitOpacity, exitScale, onDismissed]);

  const accentGlowSize = width * 0.85;
  const softGlowSize = width * 0.75;

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity: exitOpacity, transform: [{ scale: exitScale }] },
      ]}
      pointerEvents="none"
    >
      <SoftGlow
        color={SPLASH_ACCENT}
        size={accentGlowSize}
        style={{ top: -accentGlowSize * 0.2, right: -accentGlowSize * 0.2 }}
        maxOpacity={0.12}
        progress={glow}
      />
      <SoftGlow
        color={SPLASH_GLOW_SOFT}
        size={softGlowSize}
        style={{ bottom: -softGlowSize * 0.15, left: -softGlowSize * 0.15 }}
        maxOpacity={0.6}
        progress={glow}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logo,
              transform: [
                {
                  scale: logo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.82, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoHalo} />
          <View style={styles.logoCard}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
            />
          </View>
        </Animated.View>

        <View style={styles.wordRow}>
          {letters.map((char, index) => (
            <AnimatedLetter
              key={`${char}-${index}`}
              char={char}
              accent={index >= ACCENT_INDEX}
              anim={letterAnims[index]}
            />
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: tagline.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.78],
              }),
              transform: [
                {
                  translateY: tagline.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ms(8), 0],
                  }),
                },
              ],
            },
          ]}
        >
          {t('splash.tagline')}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
