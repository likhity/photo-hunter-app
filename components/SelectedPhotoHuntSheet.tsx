import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import cameraIcon from '~/assets/camera-icon.png';
import CameraScreen from '~/components/CameraScreen';
import PhotoValidationScreen from '~/components/PhotoValidationScreen';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { calculateDistance, formatDistance } from '~/utils/distance';

export default function SelectedPhotoHuntSheet() {
  const { selectedPhotoHunt, setSelectedPhotoHunt, markPhotoHuntAsHunted } = usePhotoHunt();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [distance, setDistance] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>('');

  useEffect(() => {
    if (selectedPhotoHunt) {
      calculateDistanceToPhotoHunt();
      setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 50);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [selectedPhotoHunt]);

  const calculateDistanceToPhotoHunt = async () => {
    if (!selectedPhotoHunt) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const distKm = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        selectedPhotoHunt.lat,
        selectedPhotoHunt.long
      );
      setDistance(formatDistance(distKm));
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const handleTakePhoto = async () => {
    if (!selectedPhotoHunt) return;

    // Recalculate distance to ensure we have the latest location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentDistanceKm = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        selectedPhotoHunt.lat,
        selectedPhotoHunt.long
      );

      const currentDistanceMeters = currentDistanceKm * 1000; // Convert km to meters

      console.log('Current distance:', currentDistanceMeters, 'meters');
      console.log('Photo hunt location:', selectedPhotoHunt.lat, selectedPhotoHunt.long);
      console.log('User location:', location.coords.latitude, location.coords.longitude);

      // Check if user is within 50 meters of the photo hunt location
      if (currentDistanceMeters > 50) {
        Alert.alert(
          'Too Far Away!',
          `You need to be within 50 meters\nto do this hunt.\nYou're currently ${formatDistance(currentDistanceKm)} away.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setShowCamera(true);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  const handlePhotoTaken = (photoUri: string) => {
    setCapturedPhotoUri(photoUri);
    setShowCamera(false);
    setShowValidation(true);
  };

  const handleValidationComplete = (success: boolean) => {
    setShowValidation(false);

    if (success && selectedPhotoHunt) {
      markPhotoHuntAsHunted(selectedPhotoHunt.id);
      Alert.alert(
        'Success!',
        `Congratulations! You've completed the "${selectedPhotoHunt.name}" photo hunt!`,
        [{ text: 'OK', onPress: () => setSelectedPhotoHunt(null) }]
      );
    } else {
      Alert.alert(
        'Try Again',
        "The photo doesn't match the reference image. Please try taking another photo.",
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetryPhoto = () => {
    setShowValidation(false);
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setCapturedPhotoUri('');
  };

  const openInAppleMaps = () => {
    if (!selectedPhotoHunt) return;

    const { lat, long, name } = selectedPhotoHunt;
    const encodedName = encodeURIComponent(name);
    const url = `http://maps.apple.com/?q=${encodedName}&ll=${lat},${long}`;
    Linking.openURL(url);
  };

  const openInGoogleMaps = () => {
    if (!selectedPhotoHunt) return;

    const { lat, long } = selectedPhotoHunt;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url);
  };

  // Show camera screen
  if (showCamera && selectedPhotoHunt) {
    return (
      <CameraScreen
        onPhotoTaken={handlePhotoTaken}
        onClose={handleCloseCamera}
        photoHuntName={selectedPhotoHunt.name}
      />
    );
  }

  // Show validation screen
  if (showValidation && selectedPhotoHunt && capturedPhotoUri) {
    return (
      <PhotoValidationScreen
        photoUri={capturedPhotoUri}
        photoHuntName={selectedPhotoHunt.name}
        onValidationComplete={handleValidationComplete}
        onRetry={handleRetryPhoto}
      />
    );
  }

  if (!selectedPhotoHunt) {
    return null;
  }

  const isHunted = selectedPhotoHunt.hunted;
  const backgroundColor = isHunted ? '#4CAF50' : '#E14545';
  const buttonText = isHunted ? 'Hunt Again' : "Let's Hunt!";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[280]}
      enablePanDownToClose
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor }]}
      handleIndicatorStyle={styles.handleIndicator}
      onClose={() => {
        setSelectedPhotoHunt(null);
      }}>
      {selectedPhotoHunt && (
        <BottomSheetView style={styles.container}>
          {/* Header with distance */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{selectedPhotoHunt.name}</Text>
              <Text style={styles.description}>{selectedPhotoHunt.description}</Text>
            </View>
            <View style={styles.distanceContainer}>
              <MaterialIcons
                name="location-on"
                size={16}
                color="white"
                style={styles.distanceIcon}
              />
              <Text style={styles.distance}>{distance}</Text>
            </View>
          </View>

          {/* Navigation section */}
          <View style={styles.navigationSection}>
            <View style={[styles.horizontalLine, { marginBottom: 20 }]} />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="navigation" size={20} color="white" />
              </View>
              <Text style={styles.sectionTitle}>Navigate</Text>
            </View>

            <View style={styles.navigationButtonsContainer}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.navigationButton} onPress={openInAppleMaps}>
                  <Text style={styles.navigationButtonText}>Apple Maps</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.navigationButton} onPress={openInGoogleMaps}>
                <Text style={styles.navigationButtonText}>Google Maps</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.horizontalLine, { marginTop: 30 }]} />
          </View>

          {/* Hunt button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isHunted ? '#4CAF50' : '#E14545' }]}
            onPress={handleTakePhoto}>
            <View style={styles.actionButtonContent}>
              <Image source={cameraIcon} style={styles.cameraIcon} />
              <Text style={styles.actionButtonText}>{buttonText}</Text>
            </View>
          </TouchableOpacity>

          {/* Bottom tail pointer */}
          <View style={[styles.tail, { borderTopColor: backgroundColor }]} />
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: 'white',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Sen',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Sen',
    color: 'white',
    opacity: 0.9,
    lineHeight: 22,
  },
  distanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    marginRight: 4,
  },
  distance: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
  },
  navigationSection: {
    marginBottom: 20,
  },
  horizontalLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
    width: 'auto',
    marginBottom: 20,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cameraIcon: {
    width: 40,
    height: 40,
    marginRight: 25,
    resizeMode: 'contain',
    tintColor: 'white',
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 20,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
  },
  navigationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    maxWidth: 300,
  },
  navigationButtonText: {
    fontSize: 14,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
