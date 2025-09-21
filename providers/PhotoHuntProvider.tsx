import * as Location from 'expo-location';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { getDirections } from '~/services/directions';
import photoHuntService, { PhotoHunt, CreatePhotoHuntData } from '~/services/photoHuntService';

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
  createPhotoHunt: (data: CreatePhotoHuntData) => Promise<PhotoHunt>;
  markPhotoHuntAsHunted: (id: number) => boolean;
  refreshPhotoHunts: () => void;
}

const PhotoHuntContext = createContext<PhotoHuntContextType>({
  photoHunts: [],
  selectedPhotoHunt: null,
  setSelectedPhotoHunt: () => {},
  direction: null,
  directionCoordinates: null,
  routeTime: null,
  routeDistance: null,
  createPhotoHunt: async () => ({}) as PhotoHunt,
  markPhotoHuntAsHunted: () => false,
  refreshPhotoHunts: () => {},
});

export default function PhotoHuntProvider({ children }: PropsWithChildren) {
  const [photoHunts, setPhotoHunts] = useState<PhotoHunt[]>(photoHuntService.getAllPhotoHunts());
  const [selectedPhotoHunt, setSelectedPhotoHunt] = useState<PhotoHunt | null>(null);
  const [direction, setDirection] = useState<DirectionResponse | null>(null);

  const refreshPhotoHunts = () => {
    setPhotoHunts(photoHuntService.getAllPhotoHunts());
  };

  const createPhotoHunt = async (data: CreatePhotoHuntData): Promise<PhotoHunt> => {
    const newPhotoHunt = photoHuntService.createPhotoHunt(data);
    refreshPhotoHunts();
    return newPhotoHunt;
  };

  const markPhotoHuntAsHunted = (id: number): boolean => {
    const success = photoHuntService.markPhotoHuntAsHunted(id);
    if (success) {
      refreshPhotoHunts();
    }
    return success;
  };

  useEffect(() => {
    const fetchDirections = async () => {
      if (!selectedPhotoHunt) return;
      const myLocation = await Location.getCurrentPositionAsync();

      const newDirection = await getDirections(
        [myLocation.coords.longitude, myLocation.coords.latitude],
        [selectedPhotoHunt.long, selectedPhotoHunt.lat]
      );
      setDirection(newDirection);
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
        createPhotoHunt,
        markPhotoHuntAsHunted,
        refreshPhotoHunts,
      }}>
      {children}
    </PhotoHuntContext.Provider>
  );
}

export const usePhotoHunt = () => useContext(PhotoHuntContext);
