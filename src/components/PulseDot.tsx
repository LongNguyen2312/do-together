import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ms } from 'react-native-size-matters';

interface PulseDotProps {
  color: string;
  size?: number;
}

/** "Live" indicator: a solid dot with a ring that keeps pinging outwards. */
export default function PulseDot({ color, size = ms(8) }: PulseDotProps) {
  const ping = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ping, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ping]);

  const dot = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.wrap, dot]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          dot,
          {
            backgroundColor: color,
            opacity: ping.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 0],
            }),
            transform: [
              {
                scale: ping.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2.4],
                }),
              },
            ],
          },
        ]}
      />
      <View style={[dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
