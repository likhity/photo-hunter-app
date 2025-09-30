import { MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { PhotoSubmissionResponse } from '~/types/api';

interface PhotoValidationScreenProps {
  photoUri: string;
  photoHuntId: string;
  photoHuntName: string;
  onValidationComplete: (success: boolean, result?: PhotoSubmissionResponse) => void;
  onRetry: () => void;
}

export default function PhotoValidationScreen({
  photoUri,
  photoHuntId,
  photoHuntName,
  onValidationComplete,
  onRetry,
}: PhotoValidationScreenProps) {
  const [validationStatus, setValidationStatus] = useState<'validating' | 'success' | 'failed'>(
    'validating'
  );
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [validationResult, setValidationResult] = useState<PhotoSubmissionResponse | null>(null);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const validationMessages = [
    'Analyzing Image',
    'Checking Details',
    'Verifying Integrity',
    'Processing Data',
    'Running the Model',
    'Comparing Features',
    'Validating Patterns',
    'Computing Similarity',
    'Finalizing Results',
    'Almost Done...',
  ];

  const { submitPhoto } = usePhotoHunt();

  useEffect(() => {
    // Lock to portrait orientation
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };

    lockOrientation();

    // Start validation process
    startValidation();

    // Cleanup: unlock orientation when component unmounts
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const startValidation = async () => {
    try {
      // Reset text opacity to 1 when starting validation
      textOpacity.setValue(1);

      // Cycle through validation messages with fade animation
      const messageInterval = setInterval(() => {
        // Fade out current text
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Change text and fade in
          setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % validationMessages.length);
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }, 1500); // Change message every 1500ms

      // Submit photo for validation
      const result = await submitPhoto(photoHuntId, photoUri);
      setValidationResult(result);

      // Clear message interval
      clearInterval(messageInterval);

      // Reset text opacity to 1 for final state
      textOpacity.setValue(1);

      // Determine validation status based on result
      if (result.validation.is_valid) {
        setValidationStatus('success');
      } else {
        setValidationStatus('failed');
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setValidationStatus('failed');
      Alert.alert('Validation Error', err.message || 'Failed to validate photo');
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <MaterialIcons name="refresh" size={60} color="#E14545" />;
      case 'success':
        return <MaterialIcons name="check-circle" size={60} color="#4CAF50" />;
      case 'failed':
        return <MaterialIcons name="error" size={60} color="#E14545" />;
      default:
        return <MaterialIcons name="refresh" size={60} color="#E14545" />;
    }
  };

  const getStatusTitle = () => {
    switch (validationStatus) {
      case 'validating':
        return validationMessages[currentMessageIndex];
      case 'success':
        return 'Great Hunt.';
      case 'failed':
        return 'Photo Not Recognized';
      default:
        return 'Validating Photo...';
    }
  };

  const getStatusMessage = () => {
    switch (validationStatus) {
      case 'validating':
        return 'Our AI is validating your photo with the reference image. Please wait...';
      case 'success':
        return `You've successfully hunted\n"${photoHuntName}".`;
      case 'failed':
        return (
          validationResult?.validation.notes ||
          "The photo doesn't match the reference image. Please try taking another photo."
        );
      default:
        return 'Validating your photo...';
    }
  };

  const getValidationDetails = () => {
    if (validationResult) {
      return `Similarity: ${Math.round(validationResult.validation.similarity_score * 100)}% | Confidence: ${Math.round(validationResult.validation.confidence_score * 100)}%`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Photo Preview */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          {validationStatus === 'validating' && (
            <View style={styles.photoOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
            </View>
          )}
          {validationStatus !== 'validating' && (
            <View style={styles.photoOverlay}>
              <Animated.View
                style={[
                  styles.statusIconOverlay,
                  {
                    transform: [{ scale: scaleValue }],
                  },
                ]}>
                {getStatusIcon()}
              </Animated.View>
            </View>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          {validationStatus === 'success' && (
            <Animated.View
              style={[
                styles.celebrationIcon,
                {
                  transform: [
                    {
                      scale: scaleValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}>
              <MaterialIcons name="celebration" size={60} color="#FFD700" />
            </Animated.View>
          )}

          <Animated.Text style={[styles.statusTitle, { opacity: textOpacity }]}>
            {getStatusTitle()}
          </Animated.Text>

          {/* Additional ActivityIndicator below text during validation */}
          {validationStatus === 'validating' && (
            <View style={styles.bottomSpinnerContainer}>
              <ActivityIndicator size="large" color="#E14545" />
            </View>
          )}

          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

          {/* Validation Details */}
          {validationResult && validationStatus !== 'validating' && (
            <Text style={styles.validationDetails}>{getValidationDetails()}</Text>
          )}

          {/* Action Buttons */}
          {validationStatus === 'failed' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {validationStatus === 'success' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={() => onValidationComplete(true, validationResult || undefined)}>
                <Text style={styles.proceedButtonText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 30,
    aspectRatio: 1,
    width: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerOverlay: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 40,
  },
  spinner: {
    width: 60,
    height: 60,
  },
  bottomSpinnerContainer: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIconOverlay: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 40,
  },
  statusSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  celebrationIcon: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Sen',
    textAlign: 'center',
    marginBottom: 15,
  },
  statusMessage: {
    fontSize: 16,
    color: '#ccc',
    fontFamily: 'Sen',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  validationDetails: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Sen',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#E14545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  proceedButton: {
    backgroundColor: '#E14545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
});
