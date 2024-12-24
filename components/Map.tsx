import Mapbox, { Camera, LocationPuck, MapView } from '@rnmapbox/maps';

import LineRoute from './LineRoute';
import PhotoHuntMarkers from './PhotoHuntMarkers';

import { usePhotoHunt } from '~/providers/PhotoHuntProvider';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function Map() {
  const { directionCoordinates } = usePhotoHunt();

  return (
    <MapView
      style={{ flex: 1 }}
      scaleBarPosition={{ bottom: 50, right: 50 }}
      styleURL="mapbox://styles/mapbox/dark-v11">
      <Camera followUserLocation followZoomLevel={13} />
      <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />

      <PhotoHuntMarkers />
      {directionCoordinates && <LineRoute coordinates={directionCoordinates} />}
    </MapView>
  );
}
