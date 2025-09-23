import apiClient from './apiClient';

import { API_CONFIG } from '~/config/api';
import { User, LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '~/types/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
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

  async signup(data: SignupData): Promise<User> {
    try {
      //   // ('AuthService: Attempting signup for:', data.email);
      //   // ('AuthService: Signup data received:', data);
      const registerData = {
        email: data.email,
        password: data.password,
        password_confirm: data.passwordConfirm,
        name: data.name,
      };
      //   // ('AuthService: Register data being sent:', registerData);
      const response = await apiClient.register(registerData);
      //   // ('AuthService: Signup response received:', response);

      if (response.data) {
        this.currentUser = response.data.user;
        this.isAuthenticated = true;
        // // ('AuthService: Signup successful, user set:', this.currentUser);
        return response.data.user;
      }

      throw new Error('Registration failed');
    } catch (error: any) {
      console.error('AuthService: Signup error:', error);
      throw new Error(error.message || 'Registration failed');
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
      throw new Error(error.message || 'Failed to update profile');
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
}

export default new AuthService();
