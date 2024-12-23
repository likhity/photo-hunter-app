import Mapbox, {
  Camera,
  CircleLayer,
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
      <Camera followUserLocation followZoomLevel={10} />
      <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />

      <ShapeSource id="photohunts" cluster shape={featureCollection(points)}>
        <CircleLayer
          id="clusters"
          filter={['has', 'point_count']}
          style={{
            circleColor: '#E14545',
            circleRadius: 20,
            circleOpacity: 0.5,
            circleStrokeWidth: 2,
            circleStrokeColor: 'white',
          }}
        />
        <SymbolLayer
          id="photohunt-icons"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: 'pin',
            iconSize: 0.3,
            iconAllowOverlap: true,
            iconAnchor: 'bottom',
          }}
        />
        <Images images={{ pin }} />
      </ShapeSource>
    </MapView>
  );
}
