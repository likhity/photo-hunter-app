import { ShapeSource, SymbolLayer, Images, CircleLayer } from '@rnmapbox/maps';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import { featureCollection, point } from '@turf/helpers';

import pin from '~/assets/photohunt-icon.png';
import photohunts from '~/data/photohunts.json';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';

export default function PhotoHuntMarkers() {
  const { setSelectedPhotoHunt } = usePhotoHunt();

  const points = photohunts.map((photohunt: any) =>
    point([photohunt.long, photohunt.lat], { photohunt })
  );

  const onPointPress = async (event: OnPressEvent) => {
    if (event.features[0].properties?.photohunt) {
      setSelectedPhotoHunt(event.features[0].properties.photohunt);
    }
  };

  return (
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
  );
}
