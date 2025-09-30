import { ShapeSource, SymbolLayer, Images, CircleLayer } from '@rnmapbox/maps';
import { OnPressEvent } from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import { featureCollection, point } from '@turf/helpers';
import { useEffect, useState, useRef } from 'react';
import { Animated } from 'react-native';

import pinHunted from '~/assets/photohunt-icon-green.png';
import pin from '~/assets/photohunt-icon.png';
import { usePhotoHunt } from '~/providers/PhotoHuntProvider';
import { PhotoHunt } from '~/types/api';

export default function PhotoHuntMarkers() {
  const { photoHunts, selectedPhotoHunt, setSelectedPhotoHunt } = usePhotoHunt();
  const [selectedMarkerScale, setSelectedMarkerScale] = useState(0.08);
  const scaleAnim = useRef(new Animated.Value(0.08)).current;
  const previousScaleAnim = useRef(new Animated.Value(0.08)).current;

  // Keep the selected marker visible for a bit longer to allow smooth animation
  const [keepSelectedVisible, setKeepSelectedVisible] = useState(false);
  const [previousSelectedPhotoHunt, setPreviousSelectedPhotoHunt] = useState<PhotoHunt | null>(
    null
  );

  // Animate marker scale when selection changes
  useEffect(() => {
    if (selectedPhotoHunt) {
      // If there was a previous selection and it's different, animate it down first
      if (previousSelectedPhotoHunt && previousSelectedPhotoHunt.id !== selectedPhotoHunt.id) {
        // Animate the previous marker down
        Animated.spring(previousScaleAnim, {
          toValue: 0.08,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start(() => {
          // After previous marker scales down, animate the new one up
          Animated.spring(scaleAnim, {
            toValue: 0.12,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        });
      } else {
        // No previous selection or same selection, just animate up
        Animated.spring(scaleAnim, {
          toValue: 0.12,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }

      setKeepSelectedVisible(true);
      setPreviousSelectedPhotoHunt(selectedPhotoHunt);
    } else {
      // When selectedPhotoHunt becomes null, animate the current marker down
      if (previousSelectedPhotoHunt) {
        // Use the current scaleAnim to animate the marker down
        Animated.spring(scaleAnim, {
          toValue: 0.08,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start(() => {
          // Only hide the marker after animation completes
          setKeepSelectedVisible(false);
          setPreviousSelectedPhotoHunt(null);
        });
      } else {
        // No previous selection, just hide immediately
        setKeepSelectedVisible(false);
      }
    }
  }, [selectedPhotoHunt, scaleAnim, previousScaleAnim, previousSelectedPhotoHunt]);

  // Update the scale state when animation value changes
  useEffect(() => {
    const listener = scaleAnim.addListener(({ value }) => {
      setSelectedMarkerScale(value);
    });

    return () => {
      scaleAnim.removeListener(listener);
    };
  }, [scaleAnim]);

  // Safety check to ensure photoHunts is an array
  if (!photoHunts || !Array.isArray(photoHunts)) {
    return null;
  }

  // Separate hunted and non-hunted locations (excluding selected and previous selected)
  const huntedPoints = photoHunts
    .filter(
      (photohunt) =>
        photohunt.hunted &&
        photohunt.id !== selectedPhotoHunt?.id &&
        photohunt.id !== previousSelectedPhotoHunt?.id
    )
    .map((photohunt) => point([photohunt.longitude, photohunt.latitude], { photohunt }));

  const nonHuntedPoints = photoHunts
    .filter(
      (photohunt) =>
        !photohunt.hunted &&
        photohunt.id !== selectedPhotoHunt?.id &&
        photohunt.id !== previousSelectedPhotoHunt?.id
    )
    .map((photohunt) => point([photohunt.longitude, photohunt.latitude], { photohunt }));

  // Create selected marker points (only if there's a selected photo hunt and we should keep it visible)
  const selectedHuntedPoint =
    selectedPhotoHunt && selectedPhotoHunt.hunted && keepSelectedVisible
      ? [
          point([selectedPhotoHunt.longitude, selectedPhotoHunt.latitude], {
            photohunt: selectedPhotoHunt,
          }),
        ]
      : [];

  const selectedNonHuntedPoint =
    selectedPhotoHunt && !selectedPhotoHunt.hunted && keepSelectedVisible
      ? [
          point([selectedPhotoHunt.longitude, selectedPhotoHunt.latitude], {
            photohunt: selectedPhotoHunt,
          }),
        ]
      : [];

  // Create previous selected marker points for smooth transition when switching
  // Only show previous marker when there's no current selection (during scale down)
  const shouldShowPreviousMarker =
    previousSelectedPhotoHunt && keepSelectedVisible && !selectedPhotoHunt;

  const previousSelectedHuntedPoint =
    shouldShowPreviousMarker && previousSelectedPhotoHunt.hunted
      ? [
          point([previousSelectedPhotoHunt.longitude, previousSelectedPhotoHunt.latitude], {
            photohunt: previousSelectedPhotoHunt,
          }),
        ]
      : [];

  const previousSelectedNonHuntedPoint =
    shouldShowPreviousMarker && !previousSelectedPhotoHunt.hunted
      ? [
          point([previousSelectedPhotoHunt.longitude, previousSelectedPhotoHunt.latitude], {
            photohunt: previousSelectedPhotoHunt,
          }),
        ]
      : [];

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

      {/* Selected hunted marker (larger, on top) */}
      {selectedHuntedPoint.length > 0 && (
        <ShapeSource
          id="selected-hunted-photohunt"
          shape={featureCollection(selectedHuntedPoint)}
          onPress={onPointPress}>
          <SymbolLayer
            id="selected-hunted-icon"
            style={{
              iconImage: 'pinHunted',
              iconSize: selectedMarkerScale,
              iconAllowOverlap: true,
              iconAnchor: 'bottom',
            }}
          />
        </ShapeSource>
      )}

      {/* Selected non-hunted marker (larger, on top) */}
      {selectedNonHuntedPoint.length > 0 && (
        <ShapeSource
          id="selected-non-hunted-photohunt"
          shape={featureCollection(selectedNonHuntedPoint)}
          onPress={onPointPress}>
          <SymbolLayer
            id="selected-non-hunted-icon"
            style={{
              iconImage: 'pin',
              iconSize: selectedMarkerScale,
              iconAllowOverlap: true,
              iconAnchor: 'bottom',
            }}
          />
        </ShapeSource>
      )}

      {/* Previous selected hunted marker (scaling down) */}
      {previousSelectedHuntedPoint.length > 0 && (
        <ShapeSource
          id="previous-selected-hunted-photohunt"
          shape={featureCollection(previousSelectedHuntedPoint)}
          onPress={onPointPress}>
          <SymbolLayer
            id="previous-selected-hunted-icon"
            style={{
              iconImage: 'pinHunted',
              iconSize: selectedMarkerScale, // Always use selectedMarkerScale since we only show this when selectedPhotoHunt is null
              iconAllowOverlap: true,
              iconAnchor: 'bottom',
            }}
          />
        </ShapeSource>
      )}

      {/* Previous selected non-hunted marker (scaling down) */}
      {previousSelectedNonHuntedPoint.length > 0 && (
        <ShapeSource
          id="previous-selected-non-hunted-photohunt"
          shape={featureCollection(previousSelectedNonHuntedPoint)}
          onPress={onPointPress}>
          <SymbolLayer
            id="previous-selected-non-hunted-icon"
            style={{
              iconImage: 'pin',
              iconSize: selectedMarkerScale, // Always use selectedMarkerScale since we only show this when selectedPhotoHunt is null
              iconAllowOverlap: true,
              iconAnchor: 'bottom',
            }}
          />
        </ShapeSource>
      )}

      <Images images={{ pin, pinHunted }} />
    </>
  );
}
