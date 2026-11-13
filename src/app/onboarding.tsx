import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const features = [
  {
    title: 'Smooth multiplayer',
    text: 'Play local and online matches with quick rooms and polished combat flow.',
    color: '#F44336',
  },
  {
    title: 'Premium rewards',
    text: 'Earn coins, unlock dice skins, and climb the leaderboard every week.',
    color: '#4CAF50',
  },
  {
    title: 'Game-ready board',
    text: 'Enjoy animated tokens, rich sound effects, and a crisp premium interface.',
    color: '#2196F3',
  },
];

export default function OnboardingScreen() {
  return (
    <LinearGradient colors={['#0F172A', '#10152A', '#1A254A']} style={styles.background}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Welcome to LudoVerse</Text>
        <Text style={styles.title}>Build your legacy in every match.</Text>

        {features.map((feature) => (
          <View key={feature.title} style={[styles.card, { borderColor: feature.color }]}>
            <View style={[styles.accent, { backgroundColor: feature.color }]} />
            <Text style={styles.cardTitle}>{feature.title}</Text>
            <Text style={styles.cardText}>{feature.text}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/auth')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth')}>
          <Text style={styles.secondaryButtonText}>Skip onboarding</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  eyebrow: {
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 22,
  },
  card: {
    marginBottom: 14,
    padding: 18,
    paddingLeft: 26,
    borderRadius: 20,
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accent: {
    width: 10,
    height: 46,
    borderRadius: 999,
    marginRight: 16,
  },
  cardTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardText: {
    color: '#D7E3FF',
    fontSize: 12,
    lineHeight: 18,
    flex: 3,
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#10152A',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButtonText: {
    marginTop: 16,
    color: '#B9C9FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
  },
});
