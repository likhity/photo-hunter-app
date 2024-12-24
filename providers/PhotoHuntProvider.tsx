import * as Location from 'expo-location';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { getDirections } from '~/services/directions';

const PhotoHuntContext = createContext({});

export default function PhotoHuntProvider({ children }: PropsWithChildren) {
  const [selectedPhotoHunt, setSelectedPhotoHunt] = useState();
  const [direction, setDirection] = useState();

  useEffect(() => {
    const fetchDirections = async () => {
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
        selectedPhotoHunt,
        setSelectedPhotoHunt,
        direction,
        directionCoordinates: direction?.routes?.[0]?.geometry?.coordinates,
        routeTime: direction?.routes?.[0]?.duration,
        routeDistance: direction?.routes?.[0]?.distance,
      }}>
      {children}
    </PhotoHuntContext.Provider>
  );
}

export const usePhotoHunt: any = () => useContext(PhotoHuntContext);
