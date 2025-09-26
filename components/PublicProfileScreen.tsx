import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import authService from '~/services/authService';
import { PublicUserProfile } from '~/types/api';

interface PublicProfileScreenProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

export default function PublicProfileScreen({
  isVisible,
  onClose,
  userId,
}: PublicProfileScreenProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && userId) {
      fetchPublicProfile();
    }
  }, [isVisible, userId]);

  const fetchPublicProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const publicProfile = await authService.getPublicProfile(userId);
      setProfile(publicProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProfile(null);
    setError(null);
    onClose();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.profileContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E14545" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#E14545" />
                <Text style={styles.errorText}>Failed to load profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchPublicProfile}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : profile ? (
              <>
                {/* Profile Avatar */}
                <View style={styles.avatarSection}>
                  <View style={styles.avatarContainer}>
                    {profile.avatar ? (
                      <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>
                        {profile.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.userName}>{profile.name}</Text>
                </View>

                {/* Bio Section */}
                {profile.bio && (
                  <View style={styles.bioSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="person-outline" size={20} color="#E14545" />
                      <Text style={styles.sectionTitle}>Bio</Text>
                    </View>
                    <Text style={styles.bioText}>{profile.bio}</Text>
                  </View>
                )}

                {/* Stats Section */}
                <View style={styles.statsSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="bar-chart" size={20} color="#E14545" />
                    <Text style={styles.sectionTitle}>Statistics</Text>
                  </View>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <View style={styles.statIconContainer}>
                        <MaterialIcons name="photo-camera" size={24} color="#E14545" />
                      </View>
                      <Text style={styles.statNumber}>{profile.total_created}</Text>
                      <Text style={styles.statLabel}>PhotoHunts Created</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <View style={styles.statIconContainer}>
                        <MaterialIcons name="check-circle" size={24} color="#E14545" />
                      </View>
                      <Text style={styles.statNumber}>{profile.total_completions}</Text>
                      <Text style={styles.statLabel}>PhotoHunts Completed</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Sen',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: '#E14545',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E14545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Sen',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E14545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontFamily: 'Sen',
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: 'Sen',
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bioSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  bioText: {
    fontFamily: 'Sen',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontFamily: 'Sen',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Sen',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
});
