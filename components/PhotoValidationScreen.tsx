import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { usePhotoValidation } from '~/hooks/usePhotoValidation';
import { PhotoValidationResult } from '~/services/photoValidationService';

interface PhotoValidationScreenProps {
  photoUri: string;
  photoHuntId: string;
  photoHuntName: string;
  onValidationComplete: (success: boolean, result?: PhotoValidationResult) => void;
  onRetry: () => void;
}

const { height } = Dimensions.get('window');

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
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<PhotoValidationResult | null>(null);
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);

  const { validatePhoto, isValidating, error } = usePhotoValidation();

  useEffect(() => {
    // Start validation process
    startValidation();
  }, []);

  const startValidation = async () => {
    try {
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Simulate progress updates
      const duration = 3000; // 3 seconds for real API call
      const interval = 100; // Update every 100ms
      const totalSteps = duration / interval;
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        currentStep++;
        const newProgress = (currentStep / totalSteps) * 100;
        setProgress(newProgress);

        if (currentStep >= totalSteps) {
          clearInterval(progressInterval);
        }
      }, interval);

      // Submit photo for validation
      const result = await validatePhoto(photoHuntId, 'camera');
      setValidationResult(result);

      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);

      // Determine validation status based on result
      if (result.isValid) {
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
        return 'Validating Photo...';
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
        return 'Our AI is analyzing your photo to see if it matches the reference image.';
      case 'success':
        return `You've successfully hunted\n"${photoHuntName}".`;
      case 'failed':
        return (
          validationResult?.notes ||
          "The photo doesn't match the reference image. Please try taking another photo."
        );
      default:
        return 'Validating your photo...';
    }
  };

  const getValidationDetails = () => {
    if (validationResult) {
      return `Similarity: ${Math.round(validationResult.similarityScore * 100)}% | Confidence: ${Math.round(validationResult.confidenceScore * 100)}%`;
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Photo Preview */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
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

          <Text style={styles.statusTitle}>{getStatusTitle()}</Text>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

          {/* Validation Details */}
          {validationResult && validationStatus !== 'validating' && (
            <Text style={styles.validationDetails}>{getValidationDetails()}</Text>
          )}

          {/* Progress Bar */}
          {validationStatus === 'validating' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
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
  },
  photo: {
    width: '100%',
    height: height * 0.4,
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
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E14545',
    borderRadius: 3,
  },
  progressText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Sen',
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
