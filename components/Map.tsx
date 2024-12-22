import Mapbox, { Camera, LocationPuck, MapView } from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function Map() {
  return (
    <MapView style={{ flex: 1 }}>
      <Camera followUserLocation followZoomLevel={15} />
      <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />
    </MapView>
  );
}
