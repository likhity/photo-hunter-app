import { useFonts } from 'expo-font';
import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';

import { useAnimation } from '~/providers/AnimationProvider';

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const { animationConfig } = useAnimation();
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('~/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('~/assets/fonts/Poppins-Bold.ttf'),
  });

  const iconTranslateY = useRef(new Animated.Value(-30)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const whiteOverlayAnim = useRef(new Animated.Value(0)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const iconPushUp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    const { phases } = animationConfig;

    // Small delay to ensure navigation is ready
    const startDelay = setTimeout(() => {
      // Create the animation sequence with overlapping phases
      const animationSequence = Animated.sequence([
        // Phase 1: Icon appears with spring animation
        Animated.parallel([
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(iconTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          }),
        ]),

        // Phase 3: Title animates in parallel with icon push-up
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: phases.expand * 0.6,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: phases.expand * 0.6,
            useNativeDriver: true,
          }),
          Animated.timing(iconPushUp, {
            toValue: -20,
            duration: phases.expand * 0.6,
            useNativeDriver: true,
          }),
        ]),

        // Phase 4: Hold the title and icon
        Animated.delay(phases.hold),

        // Phase 5: Fade out entire screen
        Animated.timing(screenFadeAnim, {
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
  }, [
    fontsLoaded,
    iconTranslateY,
    iconScale,
    iconOpacity,
    whiteOverlayAnim,
    screenFadeAnim,
    titleOpacity,
    titleTranslateY,
    iconPushUp,
    animationConfig,
    onAnimationComplete,
  ]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: screenFadeAnim }]}>
      {/* Red background */}
      <View style={styles.background} />

      {/* Animated icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [
              { translateY: Animated.add(iconTranslateY, iconPushUp) },
              { scale: iconScale },
            ],
          },
        ]}>
        <Image
          source={require('~/assets/photohunt-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Animated title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}>
        <Text style={styles.title}>
          <Text style={styles.titleBlack}>Photo</Text>
          <Text style={styles.titleRed}>Hunter</Text>
        </Text>
      </Animated.View>

      {/* Transparent overlay */}
      <Animated.View
        style={[
          styles.transparentOverlay,
          {
            opacity: whiteOverlayAnim,
          },
        ]}
      />
    </Animated.View>
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
  titleContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
  },
  titleBlack: {
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  titleRed: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  transparentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
