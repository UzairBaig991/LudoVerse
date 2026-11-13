import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const [scale] = useState(() => new Animated.Value(0.85));

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 1800);

    return () => clearTimeout(timeout);
  }, [scale]);

  return (
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.container}>
      <Animated.View style={[styles.logoCard, { transform: [{ scale }] }]}>
        <View style={styles.logoGlow} />
        <Text style={styles.gameName}>LudoVerse</Text>
        <Text style={styles.tagline}>Play. Compete. Conquer.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingVertical: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  logoGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFD700',
    opacity: 0.18,
    position: 'absolute',
  },
  gameName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#D7E3FF',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
