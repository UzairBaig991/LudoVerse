import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const { selectedMode, setSelectedMode, setPlayerCount, playerCount, botDifficulty, setBotDifficulty } = useGameStore();

  const handleStart = () => {
    if (selectedMode === 'Quick Match') {
      router.push('/matchmaking');
      return;
    }

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
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        {selectedMode === 'Play Against Computer' && (
          <View style={styles.difficultySection}>
            <Text style={styles.difficultyLabel}>Bot difficulty</Text>
            <View style={styles.playerRow}>
              {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[styles.playerButton, botDifficulty === difficulty && styles.selectedPlayerButton]}
                  onPress={() => setBotDifficulty(difficulty)}
                >
                  <Text style={[styles.playerButtonText, botDifficulty === difficulty && styles.selectedPlayerText]}>{difficulty}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedMode === 'Play Against Computer' ? (
          <Text style={styles.botMatchHint}>2 players · You versus the bot</Text>
        ) : (
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
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
          <Text style={styles.primaryButtonText}>Start Match</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#F0D5E9', fontSize: 14, marginBottom: 18 },
  modeCard: {
    backgroundColor: 'rgba(94,29,88,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,207,238,0.14)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  selectedModeCard: {
    borderColor: '#FFD45A',
    backgroundColor: 'rgba(255,77,173,0.15)',
  },
  modeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  selectedModeText: { color: '#FFD45A' },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 20,
  },
  difficultySection: { marginTop: 6 },
  difficultyLabel: { color: '#F0D5E9', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  botMatchHint: { color: '#D7E3FF', marginTop: 18, marginBottom: 20, textAlign: 'center', fontWeight: '700' },
  playerButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPlayerButton: {
    backgroundColor: 'rgba(255,212,90,0.18)',
    borderWidth: 1,
    borderColor: '#FFD45A',
  },
  playerButtonText: { color: '#FFFFFF', fontWeight: '700' },
  selectedPlayerText: { color: '#FFD45A' },
  primaryButton: {
    backgroundColor: '#FFD45A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#4B1A53',
    fontSize: 17,
    fontWeight: '800',
  },
});
