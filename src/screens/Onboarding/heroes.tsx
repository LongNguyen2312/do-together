import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';

import PulseDot from '@/components/PulseDot';
import { useTheme } from '@/theme';

import type { OnboardingStyles } from './styles';

interface HeroProps {
  styles: OnboardingStyles;
  width: number;
  height: number;
}

export function FindPeopleHero({ styles }: HeroProps) {
  return (
    <Image
      source={require('@/assets/images/onboarding/find-people.jpg')}
      style={styles.heroImage}
      resizeMode="contain"
    />
  );
}

export function TogetherHero({ styles, width, height }: HeroProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const floating = [
    { emoji: '🎾', top: height * 0.4, left: width * 0.025 },
    { emoji: '🍜', top: height * 0.08, right: width * 0.03 },
    { emoji: '🎬', bottom: height * 0.2, right: width * 0.03 },
  ];

  return (
    <>
      {floating.map(({ emoji, ...position }) => (
        <View key={emoji} style={[styles.floatingEmoji, position]}>
          <Text style={styles.floatingEmojiText}>{emoji}</Text>
        </View>
      ))}

      <View style={[styles.freeCard, { marginBottom: height * 0.08 }]}>
        <View style={styles.freeHeader}>
          <View style={styles.freeAvatar}>
            <Text style={styles.freeAvatarEmoji}>🙋‍♀️</Text>
          </View>
          <View>
            <Text style={styles.freeName}>{t('onboarding.freeCard.name')}</Text>
            <Text style={styles.freeStatus}>
              {t('onboarding.freeCard.status')}
            </Text>
          </View>
        </View>

        <Text style={styles.freeActivity}>
          {t('onboarding.freeCard.activity')}
        </Text>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              📍 {t('onboarding.freeCard.distance')}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              ⏱ {t('onboarding.freeCard.until')}
            </Text>
          </View>
        </View>

        <View style={styles.broadcasting}>
          <PulseDot color={colors.primary} />
          <Text
            style={styles.broadcastingText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {t('onboarding.freeCard.broadcasting')}
          </Text>
        </View>
      </View>
    </>
  );
}

export function MatchHero({
  styles,
  width,
  height,
  wide = false,
}: HeroProps & {
  /** Layout for short, wide cards: people spread sideways, tag beside them. */
  wide?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const cx = width / 2;
  const cy = height * 0.44;
  const personSize = ms(44);
  const rings = [
    { size: height * 0.42, opacity: 0.3 },
    { size: height * 0.68, opacity: 0.2 },
    { size: height * 0.94, opacity: 0.12 },
  ];
  const people = wide
    ? [
        { emoji: '🧗', color: colors.primarySoft, dx: -0.24, dy: -0.26 },
        { emoji: '☕', color: colors.mint, dx: 0.31, dy: -0.22 },
        { emoji: '🏃', color: colors.surfaceHigh, dx: 0.38, dy: 0.14 },
        { emoji: '🎾', color: colors.primarySoft, dx: -0.4, dy: 0.02 },
      ]
    : [
        { emoji: '🧗', color: colors.primarySoft, dx: -0.3, dy: -0.26 },
        { emoji: '☕', color: colors.mint, dx: 0.28, dy: -0.3 },
        { emoji: '🏃', color: colors.surfaceHigh, dx: 0.32, dy: 0.12 },
        { emoji: '🎾', color: colors.primarySoft, dx: -0.34, dy: 0.1 },
      ];
  const [climber] = people;
  const climberX = cx + climber.dx * width;
  const climberY = cy + climber.dy * height;
  const tagPosition = wide
    ? {
        left: climberX + personSize / 2 + ms(6),
        top: climberY - ms(10),
      }
    : {
        left: climberX - personSize / 2,
        top: climberY + personSize / 2 + ms(4),
      };

  return (
    <>
      {rings.map(ring => (
        <View
          key={ring.size}
          style={[
            styles.radarRing,
            {
              width: ring.size,
              height: ring.size,
              borderRadius: ring.size / 2,
              left: cx - ring.size / 2,
              top: cy - ring.size / 2,
              opacity: ring.opacity,
            },
          ]}
        />
      ))}

      {people.map(person => (
        <View
          key={person.emoji}
          style={[
            styles.person,
            {
              backgroundColor: person.color,
              left: cx + person.dx * width - personSize / 2,
              top: cy + person.dy * height - personSize / 2,
            },
          ]}
        >
          <Text style={styles.personEmoji}>{person.emoji}</Text>
        </View>
      ))}

      <View style={[styles.personTag, tagPosition]}>
        <Text style={styles.personTagText}>
          {t('onboarding.matchCard.tag')}
        </Text>
      </View>

      <View style={[styles.pin, { left: cx - ms(26), top: cy - ms(26) }]}>
        <Icon name="location" size={ms(24)} color={colors.white} />
      </View>
    </>
  );
}
