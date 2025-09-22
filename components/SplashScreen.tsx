import { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onAnimationComplete, duration = 2000 }: SplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const whiteOverlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Phase 1: Icon scales up from center
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Phase 2: Hold the icon for a moment
      Animated.delay(400),

      // Phase 3: Icon scales up to fill screen and white overlay fades in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(whiteOverlayAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Phase 4: Fade out the splash screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    // Start animation and call completion callback
    animationSequence.start(() => {
      onAnimationComplete();
    });
  }, [scaleAnim, fadeAnim, whiteOverlayAnim, onAnimationComplete, duration]);

  return (
    <View style={styles.container}>
      {/* Red background */}
      <View style={styles.background} />

      {/* Animated icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}>
        <Image
          source={require('~/assets/photohunt-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* White overlay that fades in */}
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
