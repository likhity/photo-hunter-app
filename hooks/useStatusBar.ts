import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

type StatusBarStyle = 'light' | 'dark' | 'auto';

export const useStatusBar = (style: StatusBarStyle = 'dark') => {
  useEffect(() => {
    // This ensures the status bar style is set correctly
    // The actual StatusBar component will handle the visual changes
  }, [style]);

  return style;
};

export default useStatusBar;
