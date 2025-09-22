import Mapbox, { Camera, LocationPuck, MapView } from '@rnmapbox/maps';
import { forwardRef, useRef, useImperativeHandle, useState } from 'react';

import LineRoute from './LineRoute';
import PhotoHuntMarkers from './PhotoHuntMarkers';

import { usePhotoHunt } from '~/providers/PhotoHuntProvider';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

const Map = forwardRef<any, {}>((props, ref) => {
  const { directionCoordinates } = usePhotoHunt();
  const cameraRef = useRef<Camera>(null);
  const [followUserLocation, setFollowUserLocation] = useState(true);

  useImperativeHandle(ref, () => ({
    setCamera: (options: any) => {
      // ('Setting camera with options:', options);
      if (cameraRef.current) {
        // Temporarily disable followUserLocation
        setFollowUserLocation(false);

        // Set the camera with proper parameters
        cameraRef.current.setCamera({
          centerCoordinate: options.centerCoordinate,
          zoomLevel: options.zoomLevel || 15,
          animationDuration: options.animationDuration || 1000,
        });
        // ('Camera set successfully');

        // Re-enable followUserLocation after a delay
        setTimeout(() => {
          setFollowUserLocation(true);
        }, 2000);
      } else {
        // ('Camera ref is null');
      }
    },
  }));

  return (
    <>
      <MapView
        style={{ flex: 1 }}
        scaleBarPosition={{ bottom: 50, right: 50 }}
        styleURL="mapbox://styles/mapbox/dark-v11">
        <Camera ref={cameraRef} followUserLocation={followUserLocation} followZoomLevel={13} />
        <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />

        <PhotoHuntMarkers />
        {directionCoordinates && <LineRoute coordinates={directionCoordinates} />}
      </MapView>
    </>
  );
});

Map.displayName = 'Map';

export default Map;
