import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import AnimatedSplashScreen from './AnimatedSplashScreen';
import { useAnimation } from '~/providers/AnimationProvider';
import { useUser } from '~/providers/UserProvider';

interface SplashManagerProps {
  children: React.ReactNode;
}

export default function SplashManager({ children }: SplashManagerProps) {
  const { showSplash, setShowSplash } = useAnimation();
  const { isAuthenticated, isLoading } = useUser();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const handleAnimationComplete = () => {
    setIsAnimationComplete(true);
    // Add a small delay before hiding splash to ensure smooth transition
    setTimeout(() => {
      setShowSplash(false);
    }, 100);
  };

  // Show splash screen if:
  // 1. Animation hasn't completed yet, OR
  // 2. User is still loading (to prevent flash of auth screen)
  const shouldShowSplash = showSplash && (!isAnimationComplete || isLoading);

  return (
    <View style={styles.container}>
      {children}
      {shouldShowSplash && <AnimatedSplashScreen onAnimationComplete={handleAnimationComplete} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
