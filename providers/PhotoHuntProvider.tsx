import * as Location from 'expo-location';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { useUser } from './UserProvider';

import { getDirections } from '~/services/directions';
import photoHuntService, { CreatePhotoHuntData } from '~/services/photoHuntService';
import { PhotoHunt, PhotoHuntCompletion, PhotoSubmissionResponse } from '~/types/api';

interface DirectionResponse {
  routes?: {
    geometry?: {
      coordinates: number[][];
    };
    duration?: number;
    distance?: number;
  }[];
}

interface PhotoHuntContextType {
  photoHunts: PhotoHunt[];
  selectedPhotoHunt: PhotoHunt | null;
  setSelectedPhotoHunt: (photohunt: PhotoHunt | null) => void;
  direction: DirectionResponse | null;
  directionCoordinates: number[][] | null;
  routeTime: number | null;
  routeDistance: number | null;
  isLoading: boolean;
  error: string | null;
  createPhotoHunt: (data: CreatePhotoHuntData) => Promise<PhotoHunt>;
  updatePhotoHunt: (id: string, data: Partial<CreatePhotoHuntData>) => Promise<PhotoHunt>;
  deletePhotoHunt: (id: string) => Promise<boolean>;
  submitPhoto: (photohuntId: string, imageUrl: string) => Promise<PhotoSubmissionResponse>;
  getUserCompletions: () => Promise<PhotoHuntCompletion[]>;
  getNearbyPhotoHunts: (lat: number, lng: number, radius?: number) => Promise<PhotoHunt[]>;
  refreshPhotoHunts: () => Promise<void>;
  clearError: () => void;
}

const PhotoHuntContext = createContext<PhotoHuntContextType>({
  photoHunts: [],
  selectedPhotoHunt: null,
  setSelectedPhotoHunt: () => {},
  direction: null,
  directionCoordinates: null,
  routeTime: null,
  routeDistance: null,
  isLoading: false,
  error: null,
  createPhotoHunt: async () => ({}) as PhotoHunt,
  updatePhotoHunt: async () => ({}) as PhotoHunt,
  deletePhotoHunt: async () => false,
  submitPhoto: async () => ({}) as PhotoSubmissionResponse,
  getUserCompletions: async () => [],
  getNearbyPhotoHunts: async () => [],
  refreshPhotoHunts: async () => {},
  clearError: () => {},
});

export default function PhotoHuntProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated } = useUser();
  const [photoHunts, setPhotoHunts] = useState<PhotoHunt[]>([]);
  const [selectedPhotoHunt, setSelectedPhotoHunt] = useState<PhotoHunt | null>(null);
  const [direction, setDirection] = useState<DirectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshPhotoHunts = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      const hunts = await photoHuntService.getAllPhotoHunts();
      setPhotoHunts(hunts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PhotoHunts');
      console.error('Error fetching PhotoHunts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPhotoHunt = async (data: CreatePhotoHuntData): Promise<PhotoHunt> => {
    try {
      setIsLoading(true);
      setError(null);
      const newPhotoHunt = await photoHuntService.createPhotoHunt(data);
      await refreshPhotoHunts();
      return newPhotoHunt;
    } catch (err: any) {
      setError(err.message || 'Failed to create PhotoHunt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhotoHunt = async (
    id: string,
    data: Partial<CreatePhotoHuntData>
  ): Promise<PhotoHunt> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedPhotoHunt = await photoHuntService.updatePhotoHunt(id, data);
      await refreshPhotoHunts();
      return updatedPhotoHunt;
    } catch (err: any) {
      setError(err.message || 'Failed to update PhotoHunt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhotoHunt = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const success = await photoHuntService.deletePhotoHunt(id);
      if (success) {
        await refreshPhotoHunts();
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to delete PhotoHunt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitPhoto = async (
    photohuntId: string,
    imageUrl: string
  ): Promise<PhotoSubmissionResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await photoHuntService.submitPhoto(photohuntId, imageUrl);
      await refreshPhotoHunts(); // Refresh to update hunted status
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to submit photo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserCompletions = async (): Promise<PhotoHuntCompletion[]> => {
    try {
      setError(null);
      return await photoHuntService.getUserCompletions();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch completions');
      throw err;
    }
  };

  const getNearbyPhotoHunts = async (
    lat: number,
    lng: number,
    radius?: number
  ): Promise<PhotoHunt[]> => {
    try {
      setError(null);
      return await photoHuntService.getNearbyPhotoHunts(lat, lng, radius);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby PhotoHunts');
      throw err;
    }
  };

  // Load PhotoHunts when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshPhotoHunts();
    } else {
      setPhotoHunts([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchDirections = async () => {
      if (!selectedPhotoHunt) return;

      try {
        const myLocation = await Location.getCurrentPositionAsync();

        const newDirection = await getDirections(
          [myLocation.coords.longitude, myLocation.coords.latitude],
          [selectedPhotoHunt.longitude, selectedPhotoHunt.latitude]
        );
        setDirection(newDirection);
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    };

    if (selectedPhotoHunt) {
      fetchDirections();
    }
  }, [selectedPhotoHunt]);

  return (
    <PhotoHuntContext.Provider
      value={{
        photoHunts,
        selectedPhotoHunt,
        setSelectedPhotoHunt,
        direction,
        directionCoordinates: direction?.routes?.[0]?.geometry?.coordinates || null,
        routeTime: direction?.routes?.[0]?.duration || null,
        routeDistance: direction?.routes?.[0]?.distance || null,
        isLoading,
        error,
        createPhotoHunt,
        updatePhotoHunt,
        deletePhotoHunt,
        submitPhoto,
        getUserCompletions,
        getNearbyPhotoHunts,
        refreshPhotoHunts,
        clearError,
      }}>
      {children}
    </PhotoHuntContext.Provider>
  );
}

export const usePhotoHunt = () => useContext(PhotoHuntContext);
