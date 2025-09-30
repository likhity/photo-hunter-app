import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { GoogleStyleInput } from './GoogleStyleInput';
import { buildEndpointUrl } from '~/config/api';

import { useUser } from '~/providers/UserProvider';

interface SignupStep3Props {
  onBack: () => void;
  onNext: (password: string, passwordConfirm: string) => void;
  name: string;
  email: string;
}

export default function SignupStep3({ onBack, onNext, name, email }: SignupStep3Props) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {} = useUser();

  const handleComplete = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Initiate OTP via backend (Twilio Verify)
      const ok = await initiateOtp();
      if (!ok) {
        // Error message already set in initiateOtp
        return;
      }

      // Proceed to OTP verification step
      onNext(password, confirmPassword);
    } catch (error) {
      setError('Failed to initiate verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateOtp = async (): Promise<boolean> => {
    try {
      const response = await fetch(buildEndpointUrl('/auth/initiate-otp/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        // Handle field-level errors from backend
        if (errorData?.email?.length) {
          setError('An account with this email already exists');
          return false;
        }
        if (errorData?.name?.length) {
          setError('This name is already taken');
          return false;
        }
        throw new Error(`Failed to initiate OTP verification: ${response.status}`);
      }

      const data = await response.json();
      console.log('OTP initiation status:', data);
      return true;
    } catch (error) {
      console.error('Error initiating OTP:', error);
      // Surface a generic error if we didn't already set a specific one
      if (!error) {
        setError('Failed to initiate verification. Please try again.');
      }
      return false;
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
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%' }]} />
              </View>
              <Text style={styles.progressText}>Step 3 of 4</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Create a password</Text>
            <Text style={styles.subtitle}>Choose a strong password to secure your account</Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={error}
                secureTextEntry={!showPassword}
                showPasswordToggle
                onPasswordToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                autoFocus
                returnKeyType="next"
              />

              <GoogleStyleInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                showPasswordToggle
                onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                showPassword={showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleComplete}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                (!password.trim() || !confirmPassword.trim() || isLoading) &&
                  styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!password.trim() || !confirmPassword.trim() || isLoading}>
              <Text
                style={[
                  styles.completeButtonText,
                  (!password.trim() || !confirmPassword.trim() || isLoading) &&
                    styles.completeButtonTextDisabled,
                ]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
              {!isLoading && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={password.trim() && confirmPassword.trim() ? '#FFFFFF' : '#9CA3AF'}
                />
              )}
            </TouchableOpacity>
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
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E14545',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: '#6B7280',
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
    marginBottom: 32,
  },
  footer: {
    paddingBottom: 40,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  completeButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  completeButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  completeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
