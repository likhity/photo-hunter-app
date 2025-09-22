import { ShapeSource, SymbolLayer, Images, CircleLayer } from '@rnmapbox/maps';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import { featureCollection, point } from '@turf/helpers';

import pinHunted from '~/assets/photohunt-icon-green.png';
import pin from '~/assets/photohunt-icon.png';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';

export default function PhotoHuntMarkers() {
  const { photoHunts, setSelectedPhotoHunt } = usePhotoHunt();

  // Safety check to ensure photoHunts is an array
  if (!photoHunts || !Array.isArray(photoHunts)) {
    return null;
  }

  // Separate hunted and non-hunted locations
  const huntedPoints = photoHunts
    .filter((photohunt) => photohunt.hunted)
    .map((photohunt) => point([photohunt.longitude, photohunt.latitude], { photohunt }));

  const nonHuntedPoints = photoHunts
    .filter((photohunt) => !photohunt.hunted)
    .map((photohunt) => point([photohunt.longitude, photohunt.latitude], { photohunt }));

  const onPointPress = async (event: OnPressEvent) => {
    if (event.features[0].properties?.photohunt) {
      setSelectedPhotoHunt(event.features[0].properties.photohunt);
    }
  };

  return (
    <>
      {/* Non-hunted locations */}
      <ShapeSource
        id="non-hunted-photohunts"
        cluster
        shape={featureCollection(nonHuntedPoints)}
        onPress={onPointPress}>
        <CircleLayer
          id="non-hunted-clusters"
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
          id="non-hunted-icons"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: 'pin',
            iconSize: 0.08,
            iconAllowOverlap: true,
            iconAnchor: 'bottom',
          }}
        />
      </ShapeSource>

      {/* Hunted locations */}
      <ShapeSource
        id="hunted-photohunts"
        cluster
        shape={featureCollection(huntedPoints)}
        onPress={onPointPress}>
        <CircleLayer
          id="hunted-clusters"
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
          id="hunted-icons"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: 'pinHunted',
            iconSize: 0.08,
            iconAllowOverlap: true,
            iconAnchor: 'bottom',
          }}
        />
      </ShapeSource>

      <Images images={{ pin, pinHunted }} />
    </>
  );
}
