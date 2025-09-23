import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import LandingScreen from '~/components/LandingScreen';
import NewLoginScreen from '~/components/NewLoginScreen';
import SignupStep1 from '~/components/SignupStep1';
import SignupStep2 from '~/components/SignupStep2';
import SignupStep3 from '~/components/SignupStep3';
import { useUser } from '~/providers/UserProvider';

type AuthStep = 'landing' | 'login' | 'signup1' | 'signup2' | 'signup3';

export default function AuthScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();
  const [currentStep, setCurrentStep] = useState<AuthStep>('landing');
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
  });

  // Redirect to main app when user becomes authenticated
  useEffect(() => {
    // // ('Auth screen - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading && isAuthenticated) {
      //   // ('Redirecting to main app...');
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = () => {
    setCurrentStep('login');
  };

  const handleSignup = () => {
    setCurrentStep('signup1');
  };

  const handleBackToLanding = () => {
    setCurrentStep('landing');
    setSignupData({ name: '', email: '' });
  };

  const handleSignupStep1Next = (name: string) => {
    setSignupData((prev) => ({ ...prev, name }));
    setCurrentStep('signup2');
  };

  const handleSignupStep2Next = (email: string) => {
    setSignupData((prev) => ({ ...prev, email }));
    setCurrentStep('signup3');
  };

  const handleSignupComplete = () => {
    // User will be automatically redirected to main app after successful signup
    // The useEffect above will handle the redirect when isAuthenticated becomes true
    setSignupData({ name: '', email: '' });
  };

  const handleBackToSignup1 = () => {
    setCurrentStep('signup1');
  };

  const handleBackToSignup2 = () => {
    setCurrentStep('signup2');
  };

  const handleSwitchToSignup = () => {
    setCurrentStep('signup1');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.container}>
        {currentStep === 'landing' && (
          <LandingScreen onLogin={handleLogin} onSignup={handleSignup} />
        )}
        {currentStep === 'login' && (
          <NewLoginScreen onBack={handleBackToLanding} onSwitchToSignup={handleSwitchToSignup} />
        )}
        {currentStep === 'signup1' && (
          <SignupStep1
            onNext={handleSignupStep1Next}
            onBack={handleBackToLanding}
            initialName={signupData.name}
          />
        )}
        {currentStep === 'signup2' && (
          <SignupStep2
            onNext={handleSignupStep2Next}
            onBack={handleBackToSignup1}
            initialEmail={signupData.email}
          />
        )}
        {currentStep === 'signup3' && (
          <SignupStep3
            onBack={handleBackToSignup2}
            onComplete={handleSignupComplete}
            name={signupData.name}
            email={signupData.email}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
