import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

export function useScreenTransition() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Fade in cuando la pantalla recibe foco
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();

      return () => {
        // Fade out cuando la pantalla pierde foco
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start();
      };
    }, [fadeAnim])
  );

  return fadeAnim;
}
