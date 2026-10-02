import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import PrimaryButton from '@/components/PrimaryButton';
import PulseDot from '@/components/PulseDot';
import SoftGlow from '@/components/SoftGlow';
import { useAppDispatch } from '@/store/hooks';
import { completeOnboarding } from '@/store/slices/appSlice';
import { useTheme } from '@/theme';

import { FindPeopleHero, TogetherHero, MatchHero } from './heroes';
import { createStyles, SCREEN_PADDING, type OnboardingStyles } from './styles';

const ENTER_MS = 520;
const DOT_MS = 220;

interface OnboardingSlide {
  id: string;
  key: 'slide1' | 'slide2' | 'slide3';
  emojis: [string, string, string];
  Hero: typeof FindPeopleHero;
}

const SLIDES: OnboardingSlide[] = [
  { id: '1', key: 'slide1', emojis: ['🏃', '☕', '🧗'], Hero: FindPeopleHero },
  { id: '2', key: 'slide2', emojis: ['📍', '⏱️', '👋'], Hero: TogetherHero },
  { id: '3', key: 'slide3', emojis: ['🛡️', '💬', '🤝'], Hero: MatchHero },
];

function HeroCard({
  slide,
  width,
  height,
  styles,
}: {
  slide: OnboardingSlide;
  width: number;
  height: number;
  styles: OnboardingStyles;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { Hero } = slide;

  return (
    <View style={[styles.cardShadow, { width, height }]}>
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
        <Hero styles={styles} width={width} height={height} />
        <View style={styles.badge}>
          <PulseDot color={colors.primary} />
          <Text style={styles.badgeText}>
            {t(`onboarding.${slide.key}.badge`)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SlideCopy({
  slide,
  styles,
  style,
  onLayout,
}: {
  slide: OnboardingSlide;
  styles: OnboardingStyles;
  style: object;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const avatarColors = [colors.primarySoft, colors.mint, colors.surfaceHigh];

  return (
    <Animated.View
      style={[styles.copyLayer, style]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      <Text style={styles.title}>{t(`onboarding.${slide.key}.title`)}</Text>
      <Text style={styles.description}>
        {t(`onboarding.${slide.key}.description`)}
      </Text>
      <View style={styles.highlights}>
        <View style={styles.avatars}>
          {slide.emojis.map((emoji, i) => (
            <View
              key={emoji}
              style={[
                styles.avatar,
                i > 0 && styles.avatarOverlap,
                { backgroundColor: avatarColors[i] },
              ]}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.highlightsText}>
          {t(`onboarding.${slide.key}.highlights`)}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [copyHeights, setCopyHeights] = useState<number[]>([]);

  // Shrink the hero on short phones so the copy and CTA stay on screen.
  const cardWidth = Math.min(
    width - SCREEN_PADDING * 2,
    height * 0.34 * (4 / 3),
  );
  const cardHeight = cardWidth * 0.75;

  const introOpacity = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(
    SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;

  useEffect(() => {
    Animated.timing(introOpacity, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [introOpacity]);

  useEffect(() => {
    Animated.parallel(
      dotAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: i === index ? 1 : 0,
          duration: DOT_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [dotAnims, index]);

  // Copy follows the finger on the native thread; JS only tracks which page
  // is past the midpoint so the dots and CTA label stay in sync.
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const next = Math.min(
            SLIDES.length - 1,
            Math.max(0, Math.round(event.nativeEvent.contentOffset.x / width)),
          );
          if (next !== indexRef.current) {
            indexRef.current = next;
            setIndex(next);
          }
        },
      }),
    [scrollX, width],
  );

  const finish = () => {
    dispatch(completeOnboarding());
  };

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const onContinue = () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
      return;
    }
    finish();
  };

  const onCopyLayout = (i: number) => (event: LayoutChangeEvent) => {
    const measured = Math.ceil(event.nativeEvent.layout.height);
    setCopyHeights(prev => {
      if (prev[i] === measured) {
        return prev;
      }
      const next = [...prev];
      next[i] = measured;
      return next;
    });
  };

  const copyLayerStyle = (i: number) => {
    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
    return {
      // Outgoing copy is gone before the incoming one shows, so the two
      // never overlap mid-swipe.
      opacity: scrollX.interpolate({
        inputRange: [
          (i - 0.5) * width,
          (i - 0.15) * width,
          (i + 0.15) * width,
          (i + 0.5) * width,
        ],
        outputRange: [0, 1, 1, 0],
        extrapolate: 'clamp' as const,
      }),
      transform: [
        {
          translateX: scrollX.interpolate({
            inputRange,
            outputRange: [ms(40), 0, -ms(40)],
            extrapolate: 'clamp' as const,
          }),
        },
      ],
    };
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.header, { opacity: introOpacity }]}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.brandLogo}
            tintColor={colors.primary}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>{t('common.appName')}</Text>
        </View>
        <Pressable
          onPress={finish}
          hitSlop={8}
          style={({ pressed }) => [
            styles.skipBtn,
            pressed && styles.skipBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.skip')}
        >
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.body, { opacity: introOpacity }]}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.pager}
        >
          {SLIDES.map(item => (
            <View key={item.id} style={[styles.page, { width }]}>
              <HeroCard
                slide={item}
                width={cardWidth}
                height={cardHeight}
                styles={styles}
              />
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => goTo(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1} / ${SLIDES.length}`}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [ms(8), ms(28)],
                    }),
                    backgroundColor: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [colors.border, colors.primary],
                    }),
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Fixed to the tallest slide so switching never shifts the layout. */}
        <View style={{ height: Math.max(0, ...copyHeights) }}>
          {SLIDES.map((item, i) => (
            <SlideCopy
              key={item.id}
              slide={item}
              styles={styles}
              style={copyLayerStyle(i)}
              onLayout={onCopyLayout(i)}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: introOpacity }]}>
        <PrimaryButton
          title={isLast ? t('common.getStarted') : t('common.continue')}
          trailingIcon="arrow-forward"
          onPress={onContinue}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
