import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Image, View } from 'react-native';

import plusIcon from '~/assets/plus-icon.png';
import CreatePhotoHuntSheet from '~/components/CreatePhotoHuntSheet';
import Map from '~/components/Map';
import SelectedPhotoHuntSheet from '~/components/SelectedPhotoHuntSheet';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';

export default function Home() {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const createPhotoHuntSheetRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const { createPhotoHunt } = usePhotoHunt();

  const handleCreatePhotoHunt = async (photoHuntData: {
    name: string;
    description: string;
    lat: number;
    long: number;
    referenceImage: string;
  }) => {
    try {
      await createPhotoHunt(photoHuntData);
      Alert.alert('Success', 'PhotoHunt created successfully!');
    } catch {
      Alert.alert('Error', 'Failed to create photo hunt. Please try again.');
    }
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
        console.log('Map ref is null');
      }
    } catch (error) {
      console.error('Error centering map:', error);
      Alert.alert('Error', 'Could not get your current location. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Home', headerShown: false }} />
      <Map ref={mapRef} />

      {/* Selected Photo Hunt Sheet - Above FAB */}
      <View style={styles.selectedSheetContainer}>
        <SelectedPhotoHuntSheet />
      </View>

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
      />
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
});
