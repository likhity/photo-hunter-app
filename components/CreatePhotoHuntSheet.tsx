import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import cameraIcon from '~/assets/camera-icon.png';

interface CreatePhotoHuntSheetProps {
  onSubmit: (photoHunt: {
    name: string;
    description: string;
    lat: number;
    long: number;
    referenceImage: string | { uri: string; type: string; name: string };
    difficulty?: number;
    hint?: string;
  }) => void;
  onSheetChange?: (isOpen: boolean) => void;
  onCameraOpen?: () => void;
  onPhotoTaken?: (photoUri: string) => void;
}

export interface CreatePhotoHuntSheetRef {
  open: () => void;
  close: () => void;
  setReferenceImage: (uri: string) => void;
  getPhotoHuntName: () => string;
}

const CreatePhotoHuntSheet = forwardRef<CreatePhotoHuntSheetRef, CreatePhotoHuntSheetProps>(
  ({ onSubmit, onSheetChange, onCameraOpen, onPhotoTaken }, ref) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [referenceImage, setReferenceImage] = useState<
      string | { uri: string; type: string; name: string } | null
    >(null);
    const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
    const [difficulty, setDifficulty] = useState<number>(2.5);
    const [hint, setHint] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const bottomSheetRef = useRef<BottomSheet>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        // Don't reset form when opening - preserve state
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(0);
          onSheetChange?.(true);
        }, 100);
      },
      close: () => {
        Keyboard.dismiss();
        bottomSheetRef.current?.close();
        onSheetChange?.(false);
      },
      setReferenceImage: (uri: string) => {
        // Create a file object with proper metadata for multipart upload
        const fileObject = {
          uri,
          type: 'image/jpeg', // Default to JPEG, could be enhanced to detect actual type
          name: `photohunt_${Date.now()}.jpg`, // Generate unique filename
        };
        setReferenceImage(fileObject);
      },
      getPhotoHuntName: () => {
        return name;
      },
    }));

    const takePhoto = () => {
      onCameraOpen?.();
    };

    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your location.');
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: currentLocation.coords.latitude,
          long: currentLocation.coords.longitude,
        });
      } catch {
        Alert.alert('Error', 'Could not get your current location.');
      }
    };

    const resetForm = () => {
      setName('');
      setDescription('');
      setReferenceImage(null);
      setLocation(null);
      setDifficulty(2.5);
      setHint('');
    };

    const handleSubmit = async () => {
      if (!name.trim()) {
        Alert.alert('You really need a name for your PhotoHunt.', 'Please enter a name.');
        return;
      }

      if (!description.trim()) {
        Alert.alert(
          'Come on man, put in some effort and give me a description for your PhotoHunt.',
          'Please enter a description.'
        );
        return;
      }

      if (!referenceImage) {
        Alert.alert('Really? No photo?', 'Please take a reference photo for your PhotoHunt.');
        return;
      }

      if (!location) {
        Alert.alert("What's a PhotoHunt without a location?", 'Just click the Location button.');
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit({
          name: name.trim(),
          description: description.trim(),
          lat: location.lat,
          long: location.long,
          referenceImage,
          difficulty,
          hint: hint.trim() || undefined,
        });

        // Reset form only after successful submission
        resetForm();
        bottomSheetRef.current?.close();
      } catch {
        Alert.alert('Error', 'Failed to create photo hunt. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['85%']}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        style={styles.bottomSheet}
        onChange={(index) => {
          if (index === -1) {
            Keyboard.dismiss();
            onSheetChange?.(false);
          } else if (index >= 0) {
            onSheetChange?.(true);
          }
        }}>
        <BottomSheetScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="camera" size={48} color="white" style={styles.headerIcon} />
            <Text style={styles.title}>Create PhotoHunt</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="pricetag-outline" size={20} color="white" />
              <Text style={styles.label}>
                PhotoHunt Name <Text style={styles.asterisk}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Beautiful View of the Beach"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text-outline" size={20} color="white" />
              <Text style={styles.label}>
                Description <Text style={styles.asterisk}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what hunters should look for and photograph..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Difficulty Selector */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="bar-chart-outline" size={20} color="white" />
              <Text style={styles.label}>Difficulty</Text>
            </View>
            <View style={styles.difficultyContainer}>
              <Text style={styles.difficultyValue}>{difficulty.toFixed(1)} / 5.0</Text>
              <View style={styles.difficultyButtons}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty >= level && styles.difficultyButtonActive,
                    ]}
                    onPress={() => setDifficulty(level)}>
                    <Ionicons
                      name="star"
                      size={20}
                      color={difficulty >= level ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.difficultyLabels}>
                <Text style={styles.difficultyLabel}>Easy</Text>
                <Text style={styles.difficultyLabel}>Hard</Text>
              </View>
            </View>
          </View>

          {/* Hint Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="bulb-outline" size={20} color="white" />
              <Text style={styles.label}>Hint (Optional)</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={hint}
              onChangeText={setHint}
              placeholder="Give hunters a helpful clue..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          </View>

          {/* Reference Image */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="camera-outline" size={20} color="white" />
              <Text style={styles.label}>
                Reference Photo <Text style={styles.asterisk}>*</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.imagePicker} onPress={takePhoto}>
              {referenceImage ? (
                <Image
                  source={{
                    uri: typeof referenceImage === 'string' ? referenceImage : referenceImage.uri,
                  }}
                  style={styles.selectedImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Image source={cameraIcon} style={styles.cameraIconPlaceholder} />
                  <Text style={styles.imagePlaceholderText}>Take Reference Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="location-outline" size={20} color="white" />
              <Text style={styles.label}>
                Location <Text style={styles.asterisk}>*</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
              <Text style={styles.locationButtonText}>
                {location ? 'Location Set ✓' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
            {location && (
              <Text style={styles.locationText}>
                Lat: {location.lat.toFixed(6)}, Long: {location.long.toFixed(6)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={resetForm}
              disabled={isSubmitting}>
              <Text style={styles.clearButtonText} numberOfLines={1}>
                Clear Form
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              <Text style={styles.submitText} numberOfLines={1}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

CreatePhotoHuntSheet.displayName = 'CreatePhotoHuntSheet';

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 12,
  },
  bottomSheetBackground: {
    backgroundColor: '#E14545',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    marginTop: 5,
    marginBottom: 30,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Sen',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  asterisk: {
    fontFamily: 'Sen',
    color: 'white',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Sen',
    color: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  imagePicker: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconPlaceholder: {
    width: 52,
    height: 50,
    marginBottom: 18,
    tintColor: 'white',
  },
  imagePlaceholderText: {
    fontFamily: 'Sen',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  locationButtonText: {
    fontFamily: 'Sen',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationText: {
    fontFamily: 'Sen',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Sen',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1.2,
  },
  clearButtonText: {
    fontFamily: 'Sen',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  submitText: {
    fontFamily: 'Sen',
    color: '#E14545',
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyContainer: {
    alignItems: 'center',
  },
  difficultyValue: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  difficultyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  difficultyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  difficultyLabel: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default CreatePhotoHuntSheet;
