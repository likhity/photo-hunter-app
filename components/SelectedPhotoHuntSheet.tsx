import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
import PublicProfileScreen from '~/components/PublicProfileScreen';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { calculateDistance, formatDistance } from '~/utils/distance';

export default function SelectedPhotoHuntSheet() {
  const { selectedPhotoHunt, setSelectedPhotoHunt } = usePhotoHunt();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [distance, setDistance] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  useEffect(() => {
    if (selectedPhotoHunt) {
      setIsSheetVisible(true);
      calculateDistanceToPhotoHunt();
    } else {
      setIsSheetVisible(false);
    }
  }, [selectedPhotoHunt]);

  useEffect(() => {
    if (isSheetVisible && bottomSheetRef.current) {
      // Use a small delay to ensure the component is fully mounted
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
    }
  }, [isSheetVisible, selectedPhotoHunt]);

  const calculateDistanceToPhotoHunt = async () => {
    if (!selectedPhotoHunt) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const distKm = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        selectedPhotoHunt.latitude,
        selectedPhotoHunt.longitude
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
        selectedPhotoHunt.latitude,
        selectedPhotoHunt.longitude
      );

      const currentDistanceMeters = currentDistanceKm * 1000; // Convert km to meters

      // ('Current distance:', currentDistanceMeters, 'meters');
      // ('Photo hunt location:', selectedPhotoHunt.lat, selectedPhotoHunt.long);
      // ('User location:', location.coords.latitude, location.coords.longitude);

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
      Alert.alert('Success!', `Congratulations! You hunted "${selectedPhotoHunt.name}"!`, [
        { text: 'OK', onPress: () => setSelectedPhotoHunt(null) },
      ]);
    } else {
      Alert.alert(
        'Try Again',
        "The photo doesn't match the reference image well enough. Try taking looking harder 🔍 :)",
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

    const { latitude, longitude, name } = selectedPhotoHunt;
    const encodedName = encodeURIComponent(name);
    const url = `http://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const openInGoogleMaps = () => {
    if (!selectedPhotoHunt) return;

    const { latitude, longitude } = selectedPhotoHunt;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Show camera screen
  if (showCamera && selectedPhotoHunt) {
    return (
      <CameraScreen
        onPhotoTaken={handlePhotoTaken}
        onClose={handleCloseCamera}
        photoHuntName={selectedPhotoHunt.name}
        forcedOrientation={selectedPhotoHunt.orientation}
      />
    );
  }

  // Show validation screen
  if (showValidation && selectedPhotoHunt && capturedPhotoUri) {
    return (
      <PhotoValidationScreen
        photoUri={capturedPhotoUri}
        photoHuntId={selectedPhotoHunt.id}
        photoHuntName={selectedPhotoHunt.name}
        onValidationComplete={handleValidationComplete}
        onRetry={handleRetryPhoto}
      />
    );
  }

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      setIsSheetVisible(false);
      setSelectedPhotoHunt(null);
    }
  };

  if (!selectedPhotoHunt || !isSheetVisible) {
    return null;
  }

  const isHunted = selectedPhotoHunt.hunted;
  const backgroundColor = isHunted ? '#4CAF50' : '#E14545';
  const buttonText = isHunted ? 'Hunt Again' : "Let's Hunt!";

  return (
    <>
      {/* Public Profile Screen */}
      <PublicProfileScreen
        isVisible={showPublicProfile}
        onClose={() => setShowPublicProfile(false)}
        userId={selectedPhotoHunt.created_by}
      />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['45%', '75%']}
        enablePanDownToClose
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor }]}
        handleIndicatorStyle={styles.handleIndicator}
        onChange={handleSheetChange}>
        {selectedPhotoHunt && (
          <BottomSheetScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header with distance */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{selectedPhotoHunt.name}</Text>
                <Text style={styles.description}>{selectedPhotoHunt.description}</Text>
              </View>
              <View>
                <View style={styles.distanceContainer}>
                  <MaterialIcons
                    name="location-on"
                    size={16}
                    color="white"
                    style={styles.distanceIcon}
                  />
                  <Text style={styles.distance}>{distance}</Text>
                </View>
                {/* Orientation indicator under distance */}
                {selectedPhotoHunt.orientation && (
                  <View style={styles.orientationContainer}>
                    <MaterialIcons
                      name={
                        selectedPhotoHunt.orientation === 'landscape'
                          ? 'stay-current-landscape'
                          : 'stay-current-portrait'
                      }
                      size={18}
                      color="white"
                    />
                    <Text style={styles.orientationText}>
                      {selectedPhotoHunt.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Creator Info Section */}
            <View style={styles.creatorSection}>
              <TouchableOpacity
                style={styles.creatorContainer}
                onPress={() => setShowPublicProfile(true)}
                activeOpacity={0.7}>
                <View style={styles.creatorAvatar}>
                  {selectedPhotoHunt.created_by_avatar ? (
                    <Image
                      source={{ uri: selectedPhotoHunt.created_by_avatar }}
                      style={styles.creatorAvatarImage}
                    />
                  ) : (
                    <Text style={styles.creatorAvatarText}>
                      {selectedPhotoHunt.created_by_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.creatorInfo}>
                  <Text style={styles.creatorLabel}>Created by</Text>
                  <Text style={styles.creatorName}>{selectedPhotoHunt.created_by_name}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>

            {/* Difficulty Section */}
            {selectedPhotoHunt.difficulty && (
              <View style={styles.difficultySection}>
                <View style={styles.difficultyRow}>
                  <View style={[styles.sectionHeader, styles.difficultyLabel]}>
                    <View style={styles.sectionIconContainer}>
                      <Ionicons name="bar-chart-outline" size={20} color="white" />
                    </View>
                    <Text style={styles.sectionTitle}>Difficulty</Text>
                  </View>
                  <View style={styles.difficultyStars}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Ionicons
                        key={level}
                        name="star"
                        size={18}
                        color={
                          selectedPhotoHunt.difficulty! >= level
                            ? '#FFFFFF'
                            : 'rgba(255, 255, 255, 0.3)'
                        }
                        style={styles.difficultyStar}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Hint Section */}
            {selectedPhotoHunt.hint && (
              <View style={styles.hintSection}>
                <TouchableOpacity style={styles.hintHeader} onPress={() => setShowHint(!showHint)}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIconContainer}>
                      <Ionicons name="bulb-outline" size={20} color="white" />
                    </View>
                    <Text style={styles.sectionTitle}>Hint</Text>
                  </View>
                  <Ionicons
                    name={showHint ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                {showHint && (
                  <View style={styles.hintContent}>
                    <Text style={styles.hintText}>{selectedPhotoHunt.hint}</Text>
                  </View>
                )}
              </View>
            )}

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
          </BottomSheetScrollView>
        )}
      </BottomSheet>
    </>
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
    alignSelf: 'flex-end',
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
  orientationContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  orientationText: {
    fontSize: 12,
    fontFamily: 'Sen',
    color: 'rgba(255, 255, 255, 0.9)',
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
    marginBottom: 50,
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
  // Creator Section Styles
  creatorSection: {
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorAvatarText: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: 'bold',
    color: 'white',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    fontFamily: 'Sen',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 16,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: 'white',
  },
  // Difficulty Section Styles
  difficultySection: {
    marginBottom: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  difficultyLabel: {
    marginTop: 10,
  },
  difficultyStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyStar: {
    marginHorizontal: 1,
  },
  // Hint Section Styles
  hintSection: {
    marginBottom: 16,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hintContent: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 14,
    fontFamily: 'Sen',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
