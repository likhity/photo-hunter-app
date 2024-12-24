import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import PhotoHuntProvider from '~/providers/PhotoHuntProvider';

export default function Layout() {
  return (
    <PhotoHuntProvider>
      <Stack />
      <StatusBar style="light" />
    </PhotoHuntProvider>
  );
}
