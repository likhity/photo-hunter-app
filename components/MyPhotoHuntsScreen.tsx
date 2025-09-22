import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
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
} from 'react-native';

import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { useUser } from '~/providers/UserProvider';
import { PhotoHunt } from '~/services/photoHuntService';
import photoHuntService from '~/services/photoHuntService';

interface MyPhotoHuntsScreenProps {
  onClose: () => void;
}

export default function MyPhotoHuntsScreen({ onClose }: MyPhotoHuntsScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const [refreshing, setRefreshing] = useState(false);
  const { refreshPhotoHunts } = usePhotoHunt();
  const { user } = useUser();
  const [myPhotoHunts, setMyPhotoHunts] = useState<PhotoHunt[]>([]);

  useEffect(() => {
    const fetchUserPhotoHunts = async () => {
      if (user) {
        try {
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
      `Are you sure you want to delete "${photoHunt.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Coming Soon', 'Delete functionality will be available soon!');
          },
        },
      ]
    );
  };

  const handleEditPhotoHunt = (photoHunt: PhotoHunt) => {
    // TODO: Implement edit functionality
    Alert.alert('Coming Soon', 'Edit functionality will be available soon!');
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
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>My PhotoHunts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        {myPhotoHunts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="photo-library" size={64} color="#D1D5DB" />
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
                      <MaterialIcons name="edit" size={20} color="#6B7280" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeletePhotoHunt(photoHunt)}>
                      <MaterialIcons name="delete" size={20} color="#DC2626" />
                      <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Sen',
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  photoHuntsList: {
    padding: 24,
  },
  photoHuntCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  photoHuntDescription: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  photoHuntDate: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: '#9CA3AF',
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
    backgroundColor: '#F9FAFB',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontFamily: 'Sen',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  deleteText: {
    color: '#DC2626',
  },
});
