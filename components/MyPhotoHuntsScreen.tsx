import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';

import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { useUser } from '~/providers/UserProvider';
import apiClient from '~/services/apiClient';
import photoHuntService from '~/services/photoHuntService';
import { PhotoHunt } from '~/types/api';

interface MyPhotoHuntsScreenProps {
  onClose: () => void;
}

export default function MyPhotoHuntsScreen({ onClose }: MyPhotoHuntsScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPhotoHunt, setEditingPhotoHunt] = useState<PhotoHunt | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDifficulty, setEditedDifficulty] = useState(2.5);
  const [editedHint, setEditedHint] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { refreshPhotoHunts } = usePhotoHunt();
  const { user } = useUser();
  const [myPhotoHunts, setMyPhotoHunts] = useState<PhotoHunt[]>([]);

  // Debug logs
  console.log('MyPhotoHuntsScreen: Component rendered, user:', !!user, 'fontsLoaded:', fontsLoaded);

  useEffect(() => {
    const fetchUserPhotoHunts = async () => {
      if (user) {
        try {
          // Ensure API client is initialized before making requests
          await apiClient.waitForInitialization();

          // Get user-specific photo hunts
          const userPhotoHunts = await photoHuntService.getUserPhotoHunts();
          setMyPhotoHunts(userPhotoHunts);
        } catch (error) {
          console.error('Error fetching user PhotoHunts:', error);
          setMyPhotoHunts([]);
        }
      }
    };

    fetchUserPhotoHunts();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Ensure API client is initialized before making requests
      await apiClient.waitForInitialization();

      await refreshPhotoHunts();
      if (user) {
        const userPhotoHunts = await photoHuntService.getUserPhotoHunts();
        setMyPhotoHunts(userPhotoHunts);
      }
    } catch (error) {
      console.error('Error refreshing PhotoHunts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeletePhotoHunt = (photoHunt: PhotoHunt) => {
    Alert.alert(
      'Delete PhotoHunt',
      `Are you sure you want to delete "${photoHunt.name}"? This action cannot be undone and will delete all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoHuntService.deletePhotoHunt(photoHunt.id);

              // Remove from local state
              setMyPhotoHunts((prev) => prev.filter((ph) => ph.id !== photoHunt.id));

              // Refresh global PhotoHunts
              await refreshPhotoHunts();

              Alert.alert('Success', 'PhotoHunt deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting PhotoHunt:', error);
              Alert.alert('Error', error.message || 'Failed to delete PhotoHunt');
            }
          },
        },
      ]
    );
  };

  const handleEditPhotoHunt = (photoHunt: PhotoHunt) => {
    setEditingPhotoHunt(photoHunt);
    setEditedName(photoHunt.name);
    setEditedDescription(photoHunt.description);
    setEditedDifficulty(photoHunt.difficulty || 2.5);
    setEditedHint(photoHunt.hint || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPhotoHunt) return;

    try {
      if (!editedName.trim()) {
        Alert.alert('Error', 'Name cannot be empty');
        return;
      }

      if (!editedDescription.trim()) {
        Alert.alert('Error', 'Description cannot be empty');
        return;
      }

      setIsUpdating(true);

      await photoHuntService.updatePhotoHunt(editingPhotoHunt.id, {
        name: editedName.trim(),
        description: editedDescription.trim(),
        difficulty: editedDifficulty,
        hint: editedHint.trim() || undefined,
      });

      // Fetch the complete updated PhotoHunt data instead of using partial response
      const completeUpdatedPhotoHunt = await photoHuntService.getPhotoHuntById(editingPhotoHunt.id);
      console.log(
        'MyPhotoHuntsScreen: Complete updated PhotoHunt:',
        JSON.stringify(completeUpdatedPhotoHunt, null, 2)
      );

      // Update local state with complete data
      setMyPhotoHunts((prev) =>
        prev.map((ph) => (ph.id === editingPhotoHunt.id ? completeUpdatedPhotoHunt : ph))
      );

      // Refresh global PhotoHunts
      await refreshPhotoHunts();

      setShowEditModal(false);
      setEditingPhotoHunt(null);
      Alert.alert('Success', 'PhotoHunt updated successfully!');
    } catch (error: any) {
      console.error('Error updating PhotoHunt:', error);
      Alert.alert('Error', error.message || 'Failed to update PhotoHunt');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeReferenceImage = async () => {
    if (!editingPhotoHunt) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        setIsUpdating(true);

        await photoHuntService.updatePhotoHuntWithImage(editingPhotoHunt.id, {
          name: editedName.trim(),
          description: editedDescription.trim(),
          difficulty: editedDifficulty,
          hint: editedHint.trim() || undefined,
          referenceImage: {
            uri: imageUri,
            type: 'image/jpeg',
            name: `photohunt_${Date.now()}.jpg`,
          },
        });

        // Fetch the complete updated PhotoHunt data instead of using partial response
        const completeUpdatedPhotoHunt = await photoHuntService.getPhotoHuntById(
          editingPhotoHunt.id
        );
        console.log(
          'MyPhotoHuntsScreen: Complete updated PhotoHunt with image:',
          JSON.stringify(completeUpdatedPhotoHunt, null, 2)
        );

        // Update local state with complete data
        setMyPhotoHunts((prev) =>
          prev.map((ph) => (ph.id === editingPhotoHunt.id ? completeUpdatedPhotoHunt : ph))
        );

        // Refresh global PhotoHunts
        await refreshPhotoHunts();

        Alert.alert('Success', 'Reference image updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating reference image:', error);
      Alert.alert('Error', error.message || 'Failed to update reference image');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>My PhotoHunts</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My PhotoHunts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        showsVerticalScrollIndicator={false}>
        {myPhotoHunts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="photo-library" size={64} color="#FFFFFF" />
            <Text style={styles.emptyTitle}>No PhotoHunts Yet</Text>
            <Text style={styles.emptySubtitle}>Create your first PhotoHunt to get started!</Text>
          </View>
        ) : (
          <View style={styles.photoHuntsList}>
            {myPhotoHunts &&
              Array.isArray(myPhotoHunts) &&
              myPhotoHunts.map((photoHunt) => (
                <View key={photoHunt.id} style={styles.photoHuntCard}>
                  <View style={styles.photoHuntHeader}>
                    <View style={styles.photoHuntInfo}>
                      <Text style={styles.photoHuntName}>{photoHunt.name}</Text>
                      <Text style={styles.photoHuntDescription}>{photoHunt.description}</Text>
                      <Text style={styles.photoHuntDate}>
                        Created on {formatDate(photoHunt.created_at)}
                      </Text>
                    </View>
                    <View style={styles.photoHuntStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: photoHunt.hunted ? '#10B981' : '#F59E0B' },
                        ]}>
                        <Text style={styles.statusText}>
                          {photoHunt.hunted ? 'Hunted' : 'Active'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {photoHunt.reference_image && (
                    <View style={styles.referenceImageContainer}>
                      <Image
                        source={{ uri: photoHunt.reference_image }}
                        style={styles.referenceImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  <View style={styles.photoHuntActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditPhotoHunt(photoHunt)}>
                      <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeletePhotoHunt(photoHunt)}>
                      <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                      <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Edit PhotoHunt Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit PhotoHunt</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="PhotoHunt name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Describe what hunters should look for..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Difficulty Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Difficulty</Text>
                <View style={styles.difficultyContainer}>
                  <Text style={styles.difficultyValue}>{editedDifficulty.toFixed(1)} / 5.0</Text>
                  <View style={styles.difficultyButtons}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.difficultyButton,
                          editedDifficulty >= level && styles.difficultyButtonActive,
                        ]}
                        onPress={() => setEditedDifficulty(level)}>
                        <MaterialIcons
                          name="star"
                          size={20}
                          color={editedDifficulty >= level ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Hint Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hint (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedHint}
                  onChangeText={setEditedHint}
                  placeholder="Give hunters a helpful clue..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              {/* Reference Image */}
              {editingPhotoHunt?.reference_image && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reference Image</Text>
                  <View style={styles.editReferenceImageContainer}>
                    <Image
                      source={{ uri: editingPhotoHunt.reference_image }}
                      style={styles.referenceImagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={handleChangeReferenceImage}
                      disabled={isUpdating}>
                      <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                      <Text style={styles.changeImageText}>Change Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={isUpdating}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                  onPress={handleSaveEdit}
                  disabled={isUpdating}>
                  <Text style={styles.saveButtonText}>
                    {isUpdating ? 'Updating...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E14545',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: 'Sen',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  photoHuntsList: {
    padding: 24,
  },
  photoHuntCard: {
    backgroundColor: '#E14545',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  photoHuntHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  photoHuntInfo: {
    flex: 1,
    marginRight: 12,
  },
  photoHuntName: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoHuntDescription: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  photoHuntDate: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  photoHuntStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontFamily: 'Sen',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referenceImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  referenceImage: {
    width: '100%',
    height: 120,
  },
  photoHuntActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderColor: 'rgba(220, 38, 38, 0.5)',
  },
  actionText: {
    fontFamily: 'Sen',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  deleteText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#E14545',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontFamily: 'Sen',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontFamily: 'Sen',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  editReferenceImageContainer: {
    alignItems: 'center',
  },
  referenceImagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changeImageText: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveButtonText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#E14545',
  },
});
