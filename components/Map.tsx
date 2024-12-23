import Mapbox, {
  Camera,
  Images,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from '@rnmapbox/maps';
import { featureCollection, point } from '@turf/helpers';

import pin from '~/assets/photohunt-icon.png';
import photohunts from '~/data/photohunts.json';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function Map() {
  const points = photohunts.map((photohunt) => point([photohunt.long, photohunt.lat]));

  return (
    <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/dark-v11">
      <Camera followUserLocation followZoomLevel={15} />
      <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />

      <ShapeSource id="photohunts" shape={featureCollection(points)}>
        <SymbolLayer
          id="photohunter-icons"
          style={{
            iconImage: 'pin',
            iconSize: 0.3,
            iconAllowOverlap: true,
          }}
        />
        <Images images={{ pin }} />
      </ShapeSource>
    </MapView>
  );
}
