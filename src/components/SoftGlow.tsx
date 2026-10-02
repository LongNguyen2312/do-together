import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/** Many faint discs so each step is too small to read as a ring. */
const RINGS = Array.from({ length: 16 }, (_, i) => 1 - i * 0.055);

interface SoftGlowProps {
  color: string;
  size: number;
  /** Opacity at the centre, where every disc overlaps. */
  maxOpacity: number;
  style?: StyleProp<ViewStyle>;
  /** 0 → 1 fades and scales the glow in. */
  progress?: Animated.Value;
}

/** Concentric discs approximate a blurred radial glow without a blur dependency. */
export default function SoftGlow({
  color,
  size,
  maxOpacity,
  style,
  progress,
}: SoftGlowProps) {
  const animatedStyle = progress
    ? {
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.86, 1],
            }),
          },
        ],
      }
    : null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glow, { width: size, height: size }, style, animatedStyle]}
    >
      {RINGS.map(factor => (
        <View
          key={factor}
          style={[
            styles.ring,
            {
              width: size * factor,
              height: size * factor,
              borderRadius: (size * factor) / 2,
              backgroundColor: color,
              opacity: maxOpacity / RINGS.length,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
});
