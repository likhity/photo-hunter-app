import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import authService, { LoginData } from '~/services/authService';
import {
  User,
  UserProfile,
  ProfileUpdateWithAvatarRequest,
  ChangePasswordRequest,
} from '~/types/api';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBusy: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updateProfileWithAvatar: (profileData: ProfileUpdateWithAvatarRequest) => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isBusy: false,
  login: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
  updateProfile: async () => {},
  updateProfileWithAvatar: async () => {},
  changePassword: async () => {},
  deleteAccount: async () => {},
});

export default function UserProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (e.g., from stored token)
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        console.log('UserProvider: Checking authentication status...');

        // Wait for AuthService initialization to complete
        await authService.waitForInitialization();
        console.log('UserProvider: AuthService initialization complete');

        // Check if user is already authenticated (tokens exist)
        const currentUser = authService.getCurrentUser();
        const isLoggedIn = authService.isLoggedIn();

        console.log(
          'UserProvider: Auth status - isLoggedIn:',
          isLoggedIn,
          'currentUser:',
          currentUser?.email
        );

        if (isLoggedIn && currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Fetch user profile
          try {
            console.log('UserProvider: Fetching user profile...');
            const userProfile = await authService.getProfile();
            setProfile(userProfile);
            console.log('UserProvider: Profile fetched successfully');
          } catch (error) {
            console.error('UserProvider: Error fetching profile:', error);
            // If profile fetch fails, try to refresh auth
            const refreshed = await authService.refreshAuth();
            if (refreshed) {
              const refreshedUser = authService.getCurrentUser();
              if (refreshedUser) {
                setUser(refreshedUser);
                setIsAuthenticated(true);
                console.log('UserProvider: Auth refreshed successfully');
              }
            } else {
              // If refresh fails, clear auth state
              setUser(null);
              setProfile(null);
              setIsAuthenticated(false);
              console.log('UserProvider: Auth refresh failed, clearing state');
            }
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          console.log('UserProvider: User not authenticated');
        }
      } catch (error) {
        console.error('UserProvider: Error checking auth status:', error);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log('UserProvider: Auth check complete, isLoading set to false');
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (data: LoginData) => {
    try {
      // ('UserProvider: Starting login process');
      setIsLoading(true);
      const user = await authService.login(data);
      // ('UserProvider: Login successful, user:', user);
      setUser(user);
      setIsAuthenticated(true);

      // Fetch user profile after login
      try {
        const userProfile = await authService.getProfile();
        // ('UserProvider: Profile fetched successfully:', userProfile);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching profile after login:', error);
      }
    } catch (error) {
      console.error('UserProvider: Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.refreshAuth();

      if (isAuth) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);

          // Fetch updated profile
          try {
            const userProfile = await authService.getProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Error fetching profile during refresh:', error);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      setIsBusy(true);
      const updatedProfile = await authService.updateProfile(profileData);
      setProfile(updatedProfile);

      // Update user data if it was changed
      if (updatedProfile.user) {
        setUser(updatedProfile.user);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const updateProfileWithAvatar = async (profileData: ProfileUpdateWithAvatarRequest) => {
    try {
      setIsBusy(true);
      const updatedProfile = await authService.updateProfileWithAvatar(profileData);
      setProfile(updatedProfile);

      // Update user data if it was changed
      if (updatedProfile.user) {
        setUser(updatedProfile.user);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const changePassword = async (passwordData: ChangePasswordRequest) => {
    try {
      setIsBusy(true);
      await authService.changePassword(passwordData);
    } catch (error) {
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsBusy(true);
      await authService.deleteAccount();

      // Clear all state after successful deletion
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        isBusy,
        login,
        logout,
        refreshAuth,
        updateProfile,
        updateProfileWithAvatar,
        changePassword,
        deleteAccount,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
