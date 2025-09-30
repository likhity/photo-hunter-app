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

import { buildEndpointUrl } from '~/config/api';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onNext: (email: string) => void;
}

export default function ForgotPasswordScreen({ onBack, onNext }: ForgotPasswordScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(buildEndpointUrl('/auth/forgot-password/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Forgot password error:', response.status, errorData);
        throw new Error(`Failed to send reset code: ${response.status}`);
      }

      const data = await response.json();
      console.log('Reset code sent successfully:', data);

      // Proceed to reset password screen
      onNext(email.trim());
    } catch (error) {
      console.error('Error sending reset code:', error);
      setError('Failed to send reset code. Please try again.');
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
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={48} color="#E14545" />
            </View>

            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a verification code to reset
              your password.
            </Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSendResetCode}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.sendButton, (!email.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSendResetCode}
              disabled={!email.trim() || isLoading}>
              <Text
                style={[
                  styles.sendButtonText,
                  (!email.trim() || isLoading) && styles.sendButtonTextDisabled,
                ]}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Text>
              {!isLoading && (
                <MaterialIcons name="send" size={20} color={email.trim() ? '#FFFFFF' : '#9CA3AF'} />
              )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Remember your password? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.switchLink}>Sign In</Text>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 'auto',
    marginLeft: 'auto',
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
  inputContainer: {
    marginBottom: 94,
  },
  footer: {
    paddingBottom: 40,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  sendButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  sendButtonTextDisabled: {
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
