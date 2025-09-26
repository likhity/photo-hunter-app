import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashManager from '~/components/SplashManager';
import AnimationProvider from '~/providers/AnimationProvider';
import PhotoHuntProvider from '~/providers/PhotoHuntProvider';
import SettingsProvider from '~/providers/SettingsProvider';
import UserProvider from '~/providers/UserProvider';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnimationProvider>
        <SettingsProvider>
          <UserProvider>
            <PhotoHuntProvider>
              <SplashManager>
                <Stack />
                <StatusBar style="dark" />
              </SplashManager>
            </PhotoHuntProvider>
          </UserProvider>
        </SettingsProvider>
      </AnimationProvider>
    </GestureHandlerRootView>
  );
}
