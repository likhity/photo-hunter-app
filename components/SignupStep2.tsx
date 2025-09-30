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
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native';

import { GoogleStyleInput } from './GoogleStyleInput';
import { buildEndpointUrl } from '~/config/api';

interface SignupStep2Props {
  onNext: (email: string) => void;
  onBack: () => void;
  initialEmail?: string;
}

export default function SignupStep2({ onNext, onBack, initialEmail = '' }: SignupStep2Props) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    // Validate email availability with backend
    try {
      const response = await fetch(buildEndpointUrl('/auth/validate-email/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData?.email?.length) {
          setError('An account with this email already exists');
          return;
        }
        throw new Error('Validation failed');
      }
    } catch (e) {
      setError('Unable to validate email. Please try again.');
      return;
    }

    onNext(email.trim());
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
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
              <Text style={styles.progressText}>Step 2 of 4</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>What's your email?</Text>
            <Text style={styles.subtitle}>
              We'll use this to send you updates about your PhotoHunts
            </Text>

            <View style={styles.inputContainer}>
              <GoogleStyleInput
                ref={inputRef}
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                error={error}
                autoFocus
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, !email.trim() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!email.trim()}>
              <Text style={[styles.nextButtonText, !email.trim() && styles.nextButtonTextDisabled]}>
                Next
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={email.trim() ? '#FFFFFF' : '#9CA3AF'}
              />
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E14545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  nextButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
