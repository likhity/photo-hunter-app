import { createContext, PropsWithChildren, useContext, useState } from 'react';

interface AnimationConfig {
  duration: number;
  iconScale: number;
  phases: {
    iconAppear: number;
    hold: number;
    expand: number;
    fadeOut: number;
  };
}

interface AnimationContextType {
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  animationConfig: AnimationConfig;
  updateAnimationConfig: (config: Partial<AnimationConfig>) => void;
}

const defaultConfig: AnimationConfig = {
  duration: 2000,
  iconScale: 3,
  phases: {
    iconAppear: 800,
    hold: 400,
    expand: 600,
    fadeOut: 300,
  },
};

const AnimationContext = createContext<AnimationContextType>({
  showSplash: true,
  setShowSplash: () => {},
  animationConfig: defaultConfig,
  updateAnimationConfig: () => {},
});

export default function AnimationProvider({ children }: PropsWithChildren) {
  const [showSplash, setShowSplash] = useState(true);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>(defaultConfig);

  const updateAnimationConfig = (config: Partial<AnimationConfig>) => {
    setAnimationConfig((prev) => ({ ...prev, ...config }));
  };

  return (
    <AnimationContext.Provider
      value={{
        showSplash,
        setShowSplash,
        animationConfig,
        updateAnimationConfig,
      }}>
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimation = () => useContext(AnimationContext);
