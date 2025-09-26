import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  description: string;
}

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'dark',
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    description: 'A dark themed map perfect for night viewing',
  },
  {
    id: 'light',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    description: 'A clean, light themed map for daytime use',
  },
  {
    id: 'streets',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    description: 'Classic street map with detailed road information',
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v12',
    description: 'Perfect for hiking and outdoor activities',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    description: 'High-resolution satellite imagery',
  },
  {
    id: 'satellite-streets',
    name: 'Satellite Streets',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    description: 'Satellite imagery with street labels',
  },
];

interface SettingsContextType {
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MAP_STYLE: 'settings_map_style',
};

export default function SettingsProvider({ children }: PropsWithChildren) {
  const [mapStyle, setMapStyleState] = useState<MapStyle>(MAP_STYLES[0]); // Default to dark
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedStyleId = await SecureStore.getItemAsync(STORAGE_KEYS.MAP_STYLE);
      if (savedStyleId) {
        const savedStyle = MAP_STYLES.find((style) => style.id === savedStyleId);
        if (savedStyle) {
          setMapStyleState(savedStyle);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMapStyle = async (style: MapStyle) => {
    try {
      setMapStyleState(style);
      await SecureStore.setItemAsync(STORAGE_KEYS.MAP_STYLE, style.id);
    } catch (error) {
      console.error('Error saving map style:', error);
    }
  };

  const value: SettingsContextType = {
    mapStyle,
    setMapStyle,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
