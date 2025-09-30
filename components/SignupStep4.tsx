import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native';

import { GoogleStyleInput } from './GoogleStyleInput';

import { buildEndpointUrl } from '~/config/api';
import { useUser } from '~/providers/UserProvider';

interface SignupStep4Props {
  onBack: () => void;
  onComplete: () => void;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export default function SignupStep4({
  onBack,
  onComplete,
  name,
  email,
  password,
  passwordConfirm,
}: SignupStep4Props) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const { refreshAuth } = useUser();
  // No third-party UI init for Twilio Verify (email is already sent in step 3)

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const sendOTPChallenge = async () => {
    // Optionally allow resending via backend in the future
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) return;

    try {
      setIsResending(true);
      setError('');
      await sendOTPChallenge();
      setTimeLeft(60);
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const completeSignup = async () => {
    try {
      const response = await fetch(buildEndpointUrl('/auth/complete-signup/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirm: passwordConfirm,
          code: otpCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Complete signup error:', response.status, errorData);
        // Handle field-level errors from backend
        if (errorData?.email?.length) {
          setError('An account with this email already exists');
          return;
        }
        if (errorData?.name?.length) {
          setError('This name is already taken');
          return;
        }
        if (errorData?.error) {
          setError(String(errorData.error));
          return;
        }
        throw new Error(`Failed to complete signup: ${response.status}`);
      }

      const data = await response.json();
      console.log('Signup completed successfully:', data);

      // Store the tokens in SecureStore so the user is logged in
      await SecureStore.setItemAsync('access_token', data.access);
      await SecureStore.setItemAsync('refresh_token', data.refresh);

      // Refresh the auth state to recognize the new tokens
      try {
        await refreshAuth();
        console.log('Auth state refreshed successfully');
      } catch (error) {
        console.error('Error refreshing auth state:', error);
        // Continue anyway since the user was created successfully
      }

      onComplete();
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('Failed to complete signup. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await completeSignup();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Failed to verify code. Please try again.');
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
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
              <Text style={styles.progressText}>Step 4 of 4</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="email" size={48} color="#E14545" />
            </View>

            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                ref={inputRef}
                label="Verification Code"
                value={otpCode}
                onChangeText={setOtpCode}
                error={error}
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOTP}
                placeholder="000000"
              />
            </View>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={timeLeft > 0 || isResending}
                style={timeLeft > 0 ? styles.resendButtonDisabled : styles.resendButton}>
                <Text
                  style={[
                    styles.resendButtonText,
                    timeLeft > 0 && styles.resendButtonTextDisabled,
                  ]}>
                  {isResending ? 'Sending...' : timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!otpCode.trim() || otpCode.length !== 6 || isLoading) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyOTP}
              disabled={!otpCode.trim() || otpCode.length !== 6 || isLoading}>
              <Text
                style={[
                  styles.verifyButtonText,
                  (!otpCode.trim() || otpCode.length !== 6 || isLoading) &&
                    styles.verifyButtonTextDisabled,
                ]}>
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </Text>
              {!isLoading && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={otpCode.trim() && otpCode.length === 6 ? '#FFFFFF' : '#9CA3AF'}
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
    lineHeight: 24,
    textAlign: 'center',
  },
  emailText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#6B7280',
  },
  resendButton: {
    padding: 4,
  },
  resendButtonDisabled: {
    padding: 4,
    opacity: 0.5,
  },
  resendButtonText: {
    fontFamily: 'Sen',
    fontSize: 14,
    fontWeight: '600',
    color: '#E14545',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    paddingBottom: 40,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  verifyButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  verifyButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
