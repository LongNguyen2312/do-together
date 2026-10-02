import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ms } from 'react-native-size-matters';

const SIZE = ms(96);
const DOT = ms(18);
const BEAM_HALF_WIDTH = ms(22);
const BEAM_LENGTH = ms(40);
const INNER_HALF_WIDTH = ms(12);
const INNER_LENGTH = ms(26);

interface Props {
  color: string;
  /** Degrees clockwise from the top of the screen; null hides the beam. */
  rotation: Animated.AnimatedInterpolation<string> | null;
}

export default function UserPuck({ color, rotation }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulse,
          {
            backgroundColor: color,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 0],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ],
          },
        ]}
      />
      {rotation ? (
        <Animated.View
          style={[styles.beamWrap, { transform: [{ rotate: rotation }] }]}
        >
          <View style={[styles.beam, { borderTopColor: color }]} />
          <View style={[styles.beamInner, { borderTopColor: color }]} />
        </Animated.View>
      ) : null}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
  },
  beamWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  beam: {
    position: 'absolute',
    top: SIZE / 2 - BEAM_LENGTH,
    width: 0,
    height: 0,
    borderLeftWidth: BEAM_HALF_WIDTH,
    borderRightWidth: BEAM_HALF_WIDTH,
    borderTopWidth: BEAM_LENGTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.18,
  },
  beamInner: {
    position: 'absolute',
    top: SIZE / 2 - INNER_LENGTH,
    width: 0,
    height: 0,
    borderLeftWidth: INNER_HALF_WIDTH,
    borderRightWidth: INNER_HALF_WIDTH,
    borderTopWidth: INNER_LENGTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.3,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
});
