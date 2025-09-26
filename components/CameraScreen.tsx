import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';

interface CameraScreenProps {
  onPhotoTaken: (photoUri: string) => void;
  onClose: () => void;
  photoHuntName: string;
}

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ onPhotoTaken, onClose, photoHuntName }: CameraScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [isLandscape, setIsLandscape] = useState<boolean>(width > height);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let subscription: ScreenOrientation.Subscription | null = null;

    const subscribe = async () => {
      try {
        // Allow all but do not lock; we only listen and adapt UI
        await ScreenOrientation.unlockAsync();

        const current = await ScreenOrientation.getOrientationAsync();
        setIsLandscape(
          current === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            current === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        );

        subscription = ScreenOrientation.addOrientationChangeListener((event) => {
          const o = event.orientationInfo.orientation;
          const landscape =
            o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
          setIsLandscape(landscape);
        });
      } catch {
        // Fallback to Dimensions if screen-orientation fails
        const handler = ({ window }: { window: { width: number; height: number } }) => {
          setIsLandscape(window.width > window.height);
        };
        const sub = Dimensions.addEventListener('change', handler);
        subscription = {
          remove: () => {
            // @ts-ignore
            sub?.remove?.();
            // @ts-ignore
            Dimensions.removeEventListener?.('change', handler);
          },
        } as unknown as ScreenOrientation.Subscription;
      }
    };

    subscribe();

    return () => {
      if (subscription) {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await MediaLibrary.getPermissionsAsync();
        if (status !== 'granted') {
          const req = await MediaLibrary.requestPermissionsAsync();
          setHasMediaPermission(req.status === 'granted');
        } else {
          setHasMediaPermission(true);
        }
      } catch {
        setHasMediaPermission(false);
      }
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take photos for photo hunts.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setCapturedPhoto(photo.uri);
        }
      } catch {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto);
    }
  };

  const saveToCameraRoll = async () => {
    if (!capturedPhoto) return;
    try {
      if (!hasMediaPermission) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to save photos to your library.');
          return;
        }
        setHasMediaPermission(true);
      }
      await MediaLibrary.saveToLibraryAsync(capturedPhoto);
      Alert.alert('Saved', 'Photo saved to your camera roll.');
    } catch {
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} resizeMode="contain" />

          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Great Shot!</Text>
              <Text style={styles.previewSubtitle}>Want to go ahead with this photo for</Text>
              <Text style={styles.previewSubtitle}>"{photoHuntName}"?</Text>
            </View>

            <View style={styles.previewBottomContainer}>
              <View style={styles.previewButtons}>
                <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.previewSaveContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={saveToCameraRoll}>
                  <MaterialIcons name="save-alt" size={18} color="white" style={styles.saveIcon} />
                  <Text style={styles.saveButtonText}>Save to Camera Roll</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.cameraOverlay}>
          {/* Header */}
          <View style={[styles.header, isLandscape && styles.headerLandscape]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                <MaterialIcons name="close" size={24} color="white" />
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Capture Photo</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Text style={styles.flipButtonText}>
                <MaterialIcons name="flip-camera-ios" size={24} color="white" />
              </Text>
            </TouchableOpacity>
          </View>

          {/* Center overlay with photo hunt name */}
          <View style={[styles.centerOverlay, isLandscape && styles.centerOverlayLandscape]}>
            <View style={styles.photoHuntInfo}>
              <Text style={styles.photoHuntName}>{photoHuntName}</Text>
              <Text style={styles.instructionText}>Frame your shot and tap to capture</Text>
            </View>
          </View>

          {/* Bottom controls */}
          <View style={[styles.bottomControls, isLandscape && styles.bottomControlsLandscape]}>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isCapturing}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLandscape: {
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    color: 'white',
    fontSize: 18,
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  centerOverlayLandscape: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -60 }],
    alignItems: 'flex-start',
  },
  photoHuntInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  photoHuntName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Sen',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Sen',
    textAlign: 'center',
    opacity: 0.8,
  },
  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  bottomControlsLandscape: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -40 }],
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E14545',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  previewOverlayLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
  },
  previewHeader: {
    alignItems: 'center',
  },
  previewTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Sen',
    marginTop: 20,
    marginBottom: 10,
  },
  previewSubtitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Sen',
    textAlign: 'center',
    opacity: 0.9,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 30,
  },
  previewSaveContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewBottomContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  // Removed landscape-specific preview layouts to keep portrait-like layout in landscape
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
    marginRight: 8,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginLeft: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Sen',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Sen',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#E14545',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
});
