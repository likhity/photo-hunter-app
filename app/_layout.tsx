import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import PhotoHuntProvider from '~/providers/PhotoHuntProvider';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PhotoHuntProvider>
        <Stack />
        <StatusBar style="light" />
      </PhotoHuntProvider>
    </GestureHandlerRootView>
  );
}
