import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PLAYER_META, ColorKey } from '../lib/ludo';
import { useGameStore } from '../store/gameStore';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ winner?: string }>();
  const selectedMode = useGameStore((state) => state.selectedMode);
  const winner = (params.winner ?? 'red') as ColorKey;
  const winnerName = PLAYER_META[winner]?.name ?? 'Player';

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Local match complete</Text>
        <Text style={styles.title}>{winnerName} wins</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Match mode</Text>
          <Text style={styles.value}>{selectedMode}</Text>
          <Text style={styles.label}>Tokens finished</Text>
          <Text style={styles.value}>4 / 4</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/game')}>
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.secondaryButtonText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 22,
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 24,
  },
  label: {
    color: '#AFC5FF',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  value: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#10152A',
    fontWeight: '800',
    fontSize: 17,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#DDE8FF',
    fontWeight: '700',
    fontSize: 15,
  },
});
