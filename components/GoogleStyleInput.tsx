import React, { useState, forwardRef, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';

interface GoogleStyleInputProps extends TextInputProps {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
}

export const GoogleStyleInput = forwardRef<TextInput, GoogleStyleInputProps>(
  ({ label, error, showPasswordToggle, onPasswordToggle, showPassword, value, ...props }, ref) => {
    const [fontsLoaded] = useFonts({
      Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
    });
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Use the forwarded ref or fallback to internal ref
    const actualRef = ref || inputRef;

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const handleChangeText = (text: string) => {
      setHasValue(text.length > 0);
      props.onChangeText?.(text);
    };

    const handleLabelPress = () => {
      if (actualRef && 'current' in actualRef && actualRef.current) {
        actualRef.current.focus();
      }
    };

    // Update hasValue when value prop changes
    useEffect(() => {
      setHasValue((value || '').length > 0);
    }, [value]);

    if (!fontsLoaded) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={actualRef}
            style={[styles.input, isFocused && styles.inputFocused, error && styles.inputError]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            value={value}
            {...props}
          />
          {/* Only show label when not focused and no value */}
          {!isFocused && !hasValue && (
            <TouchableOpacity
              style={[styles.labelContainer, showPasswordToggle && styles.labelContainerWithToggle]}
              onPress={handleLabelPress}
              activeOpacity={1}>
              <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
            </TouchableOpacity>
          )}
          {/* Show floating label when focused or has value */}
          {(isFocused || hasValue) && (
            <Text style={[styles.floatingLabel, error && styles.labelError]}>{label}</Text>
          )}
          {showPasswordToggle && (
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={onPasswordToggle}
              activeOpacity={0.7}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 0,
    fontSize: 16,
    fontFamily: 'Sen',
    color: '#1F2937',
    backgroundColor: 'transparent',
  },
  inputFocused: {
    borderBottomColor: '#E14545',
  },
  inputError: {
    borderBottomColor: '#DC2626',
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    top: 16,
    right: 0,
    height: 20,
    justifyContent: 'center',
  },
  labelContainerWithToggle: {
    right: 40,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Sen',
    color: '#9CA3AF',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: -8,
    fontSize: 12,
    fontFamily: 'Sen',
    color: '#E14545',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    paddingRight: 8,
    zIndex: 1,
  },
  labelError: {
    color: '#DC2626',
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    top: 16,
    padding: 4,
  },
  errorText: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
