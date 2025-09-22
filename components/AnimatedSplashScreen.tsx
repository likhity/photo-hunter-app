import { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet } from 'react-native';

import { useAnimation } from '~/providers/AnimationProvider';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const { animationConfig } = useAnimation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const whiteOverlayAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { phases, iconScale } = animationConfig;

    // Small delay to ensure navigation is ready
    const startDelay = setTimeout(() => {
      // Create the animation sequence
      const animationSequence = Animated.sequence([
        // Phase 1: Icon appears and scales up
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: phases.iconAppear,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: phases.iconAppear * 0.75,
            useNativeDriver: true,
          }),
          // Optional: Add a subtle rotation
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: phases.iconAppear,
            useNativeDriver: true,
          }),
        ]),

        // Phase 2: Hold the icon
        Animated.delay(phases.hold),

        // Phase 3: Icon expands to fill screen with white overlay
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: iconScale,
            duration: phases.expand,
            useNativeDriver: true,
          }),
          Animated.timing(whiteOverlayAnim, {
            toValue: 1,
            duration: phases.expand,
            useNativeDriver: true,
          }),
        ]),

        // Phase 4: Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: phases.fadeOut,
          useNativeDriver: true,
        }),
      ]);

      // Start the animation
      animationSequence.start(() => {
        onAnimationComplete();
      });
    }, 100); // Small delay to ensure navigation is ready

    return () => clearTimeout(startDelay);
  }, [scaleAnim, fadeAnim, whiteOverlayAnim, rotationAnim, animationConfig, onAnimationComplete]);

  // Create rotation interpolation
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Red background */}
      <View style={styles.background} />

      {/* Animated icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
            opacity: fadeAnim,
          },
        ]}>
        <Image
          source={require('~/assets/photohunt-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* White overlay */}
      <Animated.View
        style={[
          styles.whiteOverlay,
          {
            opacity: whiteOverlayAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E14545',
  },
  iconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    marginTop: -60,
    marginLeft: -60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    tintColor: '#FFFFFF',
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
});
