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

interface ResetPasswordScreenProps {
  onBack: () => void;
  onComplete: () => void;
  email: string;
}

export default function ResetPasswordScreen({
  onBack,
  onComplete,
  email,
}: ResetPasswordScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const otpInputRef = useRef<TextInput>(null);
  const { refreshAuth } = useUser();

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleResendCode = async () => {
    if (timeLeft > 0) return;

    try {
      setIsResending(true);
      setError('');

      const response = await fetch(buildEndpointUrl('/auth/forgot-password/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resend code error:', response.status, errorData);
        throw new Error(`Failed to resend code: ${response.status}`);
      }

      setTimeLeft(60);
    } catch (error) {
      console.error('Error resending code:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async () => {
    // Validation
    if (!otpCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(buildEndpointUrl('/auth/reset-password/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: otpCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Reset password error:', response.status, errorData);
        throw new Error(`Failed to reset password: ${response.status}`);
      }

      const data = await response.json();
      console.log('Password reset successfully:', data);

      // If we get tokens back, store them and refresh auth
      if (data.access && data.refresh) {
        await SecureStore.setItemAsync('access_token', data.access);
        await SecureStore.setItemAsync('refresh_token', data.refresh);
        await refreshAuth();
      }

      onComplete();
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
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
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>

          {/* Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                ref={otpInputRef}
                label="Verification Code"
                value={otpCode}
                onChangeText={setOtpCode}
                error={error}
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
              />

              <GoogleStyleInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                error={error}
                secureTextEntry={!showNewPassword}
                showPasswordToggle
                onPasswordToggle={() => setShowNewPassword(!showNewPassword)}
                showPassword={showNewPassword}
                returnKeyType="next"
              />

              <GoogleStyleInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={error}
                secureTextEntry={!showConfirmPassword}
                showPasswordToggle
                onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                showPassword={showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
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
                styles.resetButton,
                (!otpCode.trim() ||
                  otpCode.length !== 6 ||
                  !newPassword.trim() ||
                  !confirmPassword.trim() ||
                  isLoading) &&
                  styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={
                !otpCode.trim() ||
                otpCode.length !== 6 ||
                !newPassword.trim() ||
                !confirmPassword.trim() ||
                isLoading
              }>
              <Text
                style={[
                  styles.resetButtonText,
                  (!otpCode.trim() ||
                    otpCode.length !== 6 ||
                    !newPassword.trim() ||
                    !confirmPassword.trim() ||
                    isLoading) &&
                    styles.resetButtonTextDisabled,
                ]}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Text>
              {!isLoading && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={
                    otpCode.trim() &&
                    otpCode.length === 6 &&
                    newPassword.trim() &&
                    confirmPassword.trim()
                      ? '#FFFFFF'
                      : '#9CA3AF'
                  }
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
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
    marginBottom: 144,
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  resetButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  resetButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  resetButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
