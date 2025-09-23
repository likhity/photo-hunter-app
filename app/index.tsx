import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Image, View, Modal } from 'react-native';

import plusIcon from '~/assets/plus-icon.png';
import AnimationConfigScreen from '~/components/AnimationConfigScreen';
import CameraScreen from '~/components/CameraScreen';
import CreatePhotoHuntSheet from '~/components/CreatePhotoHuntSheet';
import Map from '~/components/Map';
import MyPhotoHuntsScreen from '~/components/MyPhotoHuntsScreen';
import SelectedPhotoHuntSheet from '~/components/SelectedPhotoHuntSheet';
import UserMenu from '~/components/UserMenu';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { useUser } from '~/providers/UserProvider';

export default function Home() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoHuntName, setPhotoHuntName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMyPhotoHunts, setShowMyPhotoHunts] = useState(false);
  const [showAnimationConfig, setShowAnimationConfig] = useState(false);
  const createPhotoHuntSheetRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const { createPhotoHunt } = usePhotoHunt();
  const { isAuthenticated, isLoading } = useUser();

  // Handle authentication redirect
  useEffect(() => {
    // ('Main app - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading && !isAuthenticated) {
      // ('Redirecting to auth...');
      router.replace('/auth');
    } else if (!isLoading && isAuthenticated) {
      // ('User is authenticated, staying on main app');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleCreatePhotoHunt = async (photoHuntData: {
    name: string;
    description: string;
    lat: number;
    long: number;
    referenceImage: string | { uri: string; type: string; name: string };
  }) => {
    try {
      await createPhotoHunt(photoHuntData);
      Alert.alert('Success', 'PhotoHunt created successfully!');
    } catch (error: any) {
      console.error('PhotoHunt creation error in UI:', error);
      const errorMessage = error?.message || 'Failed to create photo hunt. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCameraOpen = () => {
    const name = createPhotoHuntSheetRef.current?.getPhotoHuntName() || '';
    setPhotoHuntName(name);
    setShowCamera(true);
  };

  const handlePhotoTaken = (photoUri: string) => {
    createPhotoHuntSheetRef.current?.setReferenceImage(photoUri);
    setShowCamera(false);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleCenterMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      if (mapRef.current) {
        mapRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 15,
          animationDuration: 1000,
        });
      } else {
        // ('Map ref is null');
      }
    } catch (error) {
      console.error('Error centering map:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Home', headerShown: false }} />
      <StatusBar style="light" />
      <Map ref={mapRef} />

      {/* Selected Photo Hunt Sheet - Above FAB */}
      <View style={styles.selectedSheetContainer}>
        <SelectedPhotoHuntSheet />
      </View>

      {/* Hamburger Menu Button - Top Left */}
      {!isSheetOpen && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowUserMenu(true)}
          activeOpacity={0.8}>
          <MaterialIcons name="menu" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Center Map Button - Only show when sheet is closed */}
      {!isSheetOpen && (
        <TouchableOpacity style={styles.centerButton} onPress={handleCenterMap} activeOpacity={0.8}>
          <MaterialIcons name="navigation" size={24} color="white" style={styles.centerIcon} />
        </TouchableOpacity>
      )}

      {/* Floating Action Button - Only show when sheet is closed */}
      {!isSheetOpen && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setIsSheetOpen(true);
            createPhotoHuntSheetRef.current?.open();
          }}
          activeOpacity={0.8}>
          <Image source={plusIcon} style={styles.fabIcon} />
        </TouchableOpacity>
      )}

      {/* Create Photo Hunt Bottom Sheet */}
      <CreatePhotoHuntSheet
        ref={createPhotoHuntSheetRef}
        onSubmit={handleCreatePhotoHunt}
        onSheetChange={(isOpen) => setIsSheetOpen(isOpen)}
        onCameraOpen={handleCameraOpen}
        onPhotoTaken={handlePhotoTaken}
      />

      {/* Camera Screen Overlay */}
      {showCamera && (
        <View style={styles.cameraOverlay}>
          <CameraScreen
            onPhotoTaken={handlePhotoTaken}
            onClose={handleCloseCamera}
            photoHuntName={photoHuntName || 'Reference Photo'}
          />
        </View>
      )}

      {/* User Menu Modal */}
      <UserMenu
        isVisible={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        onMyPhotoHunts={() => setShowMyPhotoHunts(true)}
        onProfile={() => {
          // TODO: Implement profile screen
          Alert.alert('Coming Soon', 'Profile screen will be available soon!');
        }}
        onAnimationConfig={() => setShowAnimationConfig(true)}
      />

      {/* My PhotoHunts Modal */}
      <Modal visible={showMyPhotoHunts} animationType="slide" presentationStyle="fullScreen">
        <MyPhotoHuntsScreen onClose={() => setShowMyPhotoHunts(false)} />
      </Modal>

      {/* Animation Config Modal */}
      <Modal visible={showAnimationConfig} animationType="slide" presentationStyle="fullScreen">
        <AnimationConfigScreen onClose={() => setShowAnimationConfig(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectedSheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 35,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E14545',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  fabIcon: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E14545',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    left: 35,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E14545',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  centerIcon: {
    transform: [
      {
        rotate: '30deg',
      },
    ],
    marginLeft: 2,
    marginBottom: 2,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
});
