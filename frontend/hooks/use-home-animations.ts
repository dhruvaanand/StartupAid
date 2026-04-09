import { useEffect } from 'react';
import {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function useHomeAnimations(dailyPercent: number) {
  // Shared values
  const section0 = useSharedValue(0);
  const section1 = useSharedValue(0);
  const section2 = useSharedValue(0);
  const section3 = useSharedValue(0);

  const progressValue = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const mascotFloatY = useSharedValue(0);
  const mascotScale = useSharedValue(1);

  const ctaScale = useSharedValue(1);
  const playIconRotate = useSharedValue(0);

  useEffect(() => {
    // Stagger sections
    section0.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    section1.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    section2.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    section3.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Circular progress value from 0 to 100
    progressValue.value = withSpring(Math.max(0, Math.min(100, dailyPercent)), {
      damping: 16,
      stiffness: 120,
      mass: 0.7,
    });

    // Subtly pulsing dot for online friends
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    // Mascot float & breathe
    mascotFloatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    mascotScale.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    // CTA breathing softly
    ctaScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    // Occasional subtle play icon wiggle
    playIconRotate.value = withRepeat(
      withSequence(
        withDelay(2500, withTiming(8, { duration: 80 })),
        withTiming(-8, { duration: 80 }),
        withTiming(5, { duration: 80 }),
        withTiming(-5, { duration: 80 }),
        withTiming(0, { duration: 80 })
      ),
      -1,
      false
    );
  }, [
    dailyPercent,
    section0,
    section1,
    section2,
    section3,
    progressValue,
    pulseScale,
    mascotFloatY,
    mascotScale,
    ctaScale,
    playIconRotate,
  ]);

  // Pre-computed styles
  const secStyle0 = useAnimatedStyle(() => ({
    opacity: section0.value,
    transform: [{ translateY: 15 * (1 - section0.value) }],
  }));
  const secStyle1 = useAnimatedStyle(() => ({
    opacity: section1.value,
    transform: [{ translateY: 15 * (1 - section1.value) }],
  }));
  const secStyle2 = useAnimatedStyle(() => ({
    opacity: section2.value,
    transform: [{ translateY: 15 * (1 - section2.value) }],
  }));
  const secStyle3 = useAnimatedStyle(() => ({
    opacity: section3.value,
    transform: [{ translateY: 15 * (1 - section3.value) }],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotFloatY.value }, { scale: mascotScale.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const playIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${playIconRotate.value}deg` }],
  }));

  const rightArcStyle = useAnimatedStyle(() => {
    const rotation = -135 + Math.min(progressValue.value / 50, 1) * 180;
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  const leftArcStyle = useAnimatedStyle(() => {
    const rotation = 45 + Math.max((progressValue.value - 50) / 50, 0) * 180;
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  return {
    secStyle0,
    secStyle1,
    secStyle2,
    secStyle3,
    mascotStyle,
    ctaStyle,
    pulseStyle,
    playIconStyle,
    rightArcStyle,
    leftArcStyle,
  };
}
