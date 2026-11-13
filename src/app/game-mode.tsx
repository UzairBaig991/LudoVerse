import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MatchMode, useGameStore } from '../store/gameStore';

const modes: MatchMode[] = [
  'Quick Match',
  'Private Room',
  'Play With Friends',
  'Offline Multiplayer',
  'Play Against Computer',
  'Local Pass-and-Play',
];

export default function GameModeScreen() {
  const { selectedMode, setSelectedMode, setPlayerCount, playerCount } = useGameStore();

  const handleStart = () => {
    if (selectedMode === 'Private Room') {
      router.push('/room');
      return;
    }

    if (selectedMode === 'Play With Friends') {
      router.push('/join-room');
      return;
    }

    router.push('/game');
  };

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose a match</Text>
        <Text style={styles.subtitle}>Select your preferred LudoVerse mode.</Text>

        {modes.map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setSelectedMode(mode)}
            style={[styles.modeCard, selectedMode === mode && styles.selectedModeCard]}
          >
            <Text style={[styles.modeText, selectedMode === mode && styles.selectedModeText]}>{mode}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.playerRow}>
          {[2, 3, 4].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.playerButton, playerCount === value && styles.selectedPlayerButton]}
              onPress={() => setPlayerCount(value)}
            >
              <Text style={[styles.playerButtonText, playerCount === value && styles.selectedPlayerText]}>{value}P</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
          <Text style={styles.primaryButtonText}>Start Match</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#B9C9FF', fontSize: 14, marginBottom: 18 },
  modeCard: {
    backgroundColor: 'rgba(19,25,40,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  selectedModeCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  modeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  selectedModeText: { color: '#FFD700' },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 20,
  },
  playerButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPlayerButton: {
    backgroundColor: 'rgba(255,215,0,0.18)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  playerButtonText: { color: '#FFFFFF', fontWeight: '700' },
  selectedPlayerText: { color: '#FFD700' },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#10152A',
    fontSize: 17,
    fontWeight: '800',
  },
});
