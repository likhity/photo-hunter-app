import Mapbox, {
  Camera,
  CircleLayer,
  Images,
  LineLayer,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from '@rnmapbox/maps';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import { featureCollection, point } from '@turf/helpers';
import * as Location from 'expo-location';
import { useState } from 'react';

import pin from '~/assets/photohunt-icon.png';
import photohunts from '~/data/photohunts.json';
import { getDirections } from '~/services/directions';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function Map() {
  const [direction, setDirection] = useState();

  const points = photohunts.map((photohunt) => point([photohunt.long, photohunt.lat]));

  const directionCoordinates = direction?.routes?.[0]?.geometry?.coordinates;

  const onPointPress = async (event: OnPressEvent) => {
    const myLocation = await Location.getCurrentPositionAsync();

    const newDirection = await getDirections(
      [myLocation.coords.longitude, myLocation.coords.latitude],
      [event.coordinates.longitude, event.coordinates.latitude]
    );
    setDirection(newDirection);
  };

  return (
    <MapView style={{ flex: 1 }}>
      <Camera followUserLocation followZoomLevel={15} />
      <LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />

      <ShapeSource id="photohunts" cluster shape={featureCollection(points)} onPress={onPointPress}>
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
      {directionCoordinates && (
        <ShapeSource
          id="routeSource"
          lineMetrics
          shape={{
            properties: {},
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: directionCoordinates,
            },
          }}>
          <LineLayer
            id="exampleLineLayer"
            style={{
              lineColor: '#E14545',
              lineCap: 'round',
              lineJoin: 'round',
              lineWidth: 7,
            }}
          />
        </ShapeSource>
      )}
    </MapView>
  );
}
