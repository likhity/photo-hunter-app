import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import PhotoHuntProvider from '~/providers/PhotoHuntProvider';
import UserProvider from '~/providers/UserProvider';
import AnimationProvider from '~/providers/AnimationProvider';
import SplashManager from '~/components/SplashManager';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnimationProvider>
        <UserProvider>
          <PhotoHuntProvider>
            <SplashManager>
              <Stack />
              <StatusBar style="dark" />
            </SplashManager>
          </PhotoHuntProvider>
        </UserProvider>
      </AnimationProvider>
    </GestureHandlerRootView>
  );
}
