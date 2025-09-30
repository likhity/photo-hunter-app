import apiClient from './apiClient';

import { API_CONFIG } from '~/config/api';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  PublicUserProfile,
  ProfileUpdateRequest,
  ProfileUpdateWithAvatarRequest,
  ChangePasswordRequest,
} from '~/types/api';

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeAuth();
  }

  // Initialize authentication state from stored tokens
  private async initializeAuth() {
    try {
      console.log('AuthService: Initializing authentication...');

      // Wait for ApiClient to finish loading tokens from SecureStore
      await apiClient.waitForInitialization();
      console.log('AuthService: ApiClient initialization complete');

      if (apiClient.isAuthenticated()) {
        console.log('AuthService: Tokens found, verifying with server...');
        // Try to get user profile to verify token is still valid
        const response = await apiClient.get<UserProfile>(API_CONFIG.ENDPOINTS.PROFILE.GET);
        if (response.data) {
          this.currentUser = response.data.user;
          this.isAuthenticated = true;
          console.log('AuthService: Authentication verified, user:', this.currentUser?.email);
        }
      } else {
        console.log('AuthService: No tokens found, user not authenticated');
      }
    } catch (error) {
      console.error('AuthService: Error initializing auth:', error);
      // If profile fetch fails, clear auth state
      this.currentUser = null;
      this.isAuthenticated = false;
    }
  }

  // Wait for initialization to complete
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null; // Mark as complete
    }
  }

  async login(data: LoginData): Promise<User> {
    try {
      //   // ('AuthService: Attempting login for:', data.email);
      const response = await apiClient.login(data.email, data.password);
      //   // ('AuthService: Login response received:', response);

      if (response.data) {
        this.currentUser = response.data.user;
        this.isAuthenticated = true;
        // // ('AuthService: Login successful, user set:', this.currentUser);
        return response.data.user;
      }

      throw new Error('Login failed');
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.currentUser = null;
      this.isAuthenticated = false;
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(API_CONFIG.ENDPOINTS.PROFILE.GET);
      if (response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch profile');
    }
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.patch<UserProfile>(
        API_CONFIG.ENDPOINTS.PROFILE.UPDATE,
        profileData
      );
      if (response.data) {
        // Update current user if profile was updated
        if (response.data.user) {
          this.currentUser = response.data.user;
        }
        return response.data;
      }
      throw new Error('Failed to update profile');
    } catch (error: any) {
      // Surface backend field errors clearly
      const parsed = error?.details?.parsedBody;
      if (parsed?.name?.length) {
        throw new Error('A user with this name already exists.');
      }
      if (parsed?.email?.length) {
        throw new Error('A user with this email already exists.');
      }
      throw new Error(error?.message || 'Failed to update profile');
    }
  }

  async updateProfileWithAvatar(profileData: ProfileUpdateWithAvatarRequest): Promise<UserProfile> {
    try {
      if (profileData.avatar_file) {
        // Use multipart form data for avatar upload
        const response = await apiClient.uploadFile<UserProfile>(
          API_CONFIG.ENDPOINTS.PROFILE.UPDATE,
          profileData.avatar_file,
          {
            name: profileData.name,
            bio: profileData.bio,
          },
          'avatar_file',
          'PATCH'
        );

        if (response.data) {
          // Update current user if profile was updated
          if (response.data.user) {
            this.currentUser = response.data.user;
          }
          return response.data;
        }
        throw new Error('Failed to update profile with avatar');
      } else {
        // Use regular JSON update if no avatar
        return this.updateProfile({
          name: profileData.name,
          bio: profileData.bio,
        } as Partial<UserProfile>);
      }
    } catch (error: any) {
      // Surface backend field errors clearly
      const parsed = error?.details?.parsedBody;
      if (parsed?.name?.length) {
        throw new Error('A user with this name already exists.');
      }
      if (parsed?.email?.length) {
        throw new Error('A user with this email already exists.');
      }
      throw new Error(error?.message || 'Failed to update profile');
    }
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post<{ message: string }>(
        API_CONFIG.ENDPOINTS.PROFILE.CHANGE_PASSWORD,
        passwordData
      );

      if (!response.data) {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        API_CONFIG.ENDPOINTS.PROFILE.DELETE_ACCOUNT
      );

      // Clear auth state after successful deletion
      this.currentUser = null;
      this.isAuthenticated = false;

      if (!response.data) {
        throw new Error('Failed to delete account');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && apiClient.isAuthenticated();
  }

  // Check if initialization is complete
  isInitialized(): boolean {
    return this.initializationPromise === null;
  }

  // Refresh authentication state
  async refreshAuth(): Promise<boolean> {
    try {
      // Ensure ApiClient is initialized before checking authentication
      await apiClient.waitForInitialization();

      // Reload tokens from SecureStore in case they were updated externally
      await apiClient.reloadTokens();

      if (apiClient.isAuthenticated()) {
        const response = await apiClient.get<UserProfile>(API_CONFIG.ENDPOINTS.PROFILE.GET);
        if (response.data) {
          this.currentUser = response.data.user;
          this.isAuthenticated = true;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      this.currentUser = null;
      this.isAuthenticated = false;
      return false;
    }
  }

  // Get public profile for any user
  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    try {
      const response = await apiClient.get<PublicUserProfile>(
        API_CONFIG.ENDPOINTS.PROFILE.PUBLIC(userId)
      );

      if (!response.data) {
        throw new Error('Failed to get public profile');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get public profile');
    }
  }
}

export default new AuthService();
