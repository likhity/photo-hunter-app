import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  ScrollView,
} from 'react-native';

import { useUser } from '~/providers/UserProvider';

interface UserMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onMyPhotoHunts: () => void;
  onProfile: () => void;
  onAnimationConfig: () => void;
}

export default function UserMenu({
  isVisible,
  onClose,
  onMyPhotoHunts,
  onProfile,
  onAnimationConfig,
}: UserMenuProps) {
  const [fontsLoaded] = useFonts({
    Sen: require('~/assets/fonts/Sen-VariableFont_wght.ttf'),
  });
  const { user, logout } = useUser();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            onClose();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      onPress: () => {
        onProfile();
        onClose();
      },
    },
    {
      id: 'my-photohunts',
      title: 'My PhotoHunts',
      icon: 'photo-library',
      onPress: () => {
        onMyPhotoHunts();
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      onPress: () => {
        // TODO: Implement settings
        Alert.alert('Coming Soon', 'Settings feature will be available soon!');
        onClose();
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help',
      onPress: () => {
        // TODO: Implement help
        Alert.alert('Coming Soon', 'Help & Support will be available soon!');
        onClose();
      },
    },
    {
      id: 'animation-config',
      title: 'Animation Settings',
      icon: 'animation',
      onPress: () => {
        onAnimationConfig();
        onClose();
      },
    },
  ];

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIcon}>
                    <MaterialIcons name={item.icon as any} size={24} color="#E14545" />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E14545',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Sen',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Sen',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: 'Sen',
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    fontFamily: 'Sen',
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
});
