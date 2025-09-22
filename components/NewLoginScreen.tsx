import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { GoogleStyleInput } from './GoogleStyleInput';

import { useUser } from '~/providers/UserProvider';

interface NewLoginScreenProps {
  onBack: () => void;
  onSwitchToSignup: () => void;
}

export default function NewLoginScreen({ onBack, onSwitchToSignup }: NewLoginScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login({ email: email.trim(), password });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Welcome back!</Text>
          </View>

          {/* Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Log in.</Text>
            <Text style={styles.subtitle}>Enter your credentials to start hunting!</Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <GoogleStyleInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={error}
                secureTextEntry={!showPassword}
                showPasswordToggle
                onPasswordToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.loginButton,
                (!email.trim() || !password.trim() || isLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!email.trim() || !password.trim() || isLoading}>
              <Text
                style={[
                  styles.loginButtonText,
                  (!email.trim() || !password.trim() || isLoading) &&
                    styles.loginButtonTextDisabled,
                ]}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onSwitchToSignup}>
                <Text style={styles.switchLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    elevation: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#E14545',
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
  },
  loginButton: {
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  loginButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginButtonTextDisabled: {
    color: '#9CA3AF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#6B7280',
  },
  switchLink: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#E14545',
  },
});
