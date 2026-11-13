import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function RoomScreen() {
  const { roomCode, playerCount, createRoom } = useGameStore();

  const copyCode = () => {
    Alert.alert('Room code copied', `Invite friends with ${roomCode}`);
  };

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Private Room</Text>
        <Text style={styles.title}>Room Ready</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Room Code</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <Text style={styles.meta}>{playerCount} players • Ready to begin</Text>
        </View>

        <View style={styles.playerList}>
          {['You', 'Nova', 'Echo', 'Milo'].slice(0, playerCount).map((player) => (
            <View key={player} style={styles.playerRow}>
              <Text style={styles.playerName}>{player}</Text>
              <Text style={styles.readyText}>Ready</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={copyCode}>
            <Text style={styles.secondaryButtonText}>Copy Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={createRoom}>
            <Text style={styles.secondaryButtonText}>New Room</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/game')}>
          <Text style={styles.primaryButtonText}>Start Match</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  eyebrow: { color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 20 },
  codeCard: {
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },
  codeLabel: { color: '#AFC5FF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1 },
  code: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 3, marginTop: 8 },
  meta: { color: '#D7E3FF', marginTop: 10 },
  playerList: { marginBottom: 20 },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  playerName: { color: '#FFFFFF', fontWeight: '700' },
  readyText: { color: '#4CAF50', fontWeight: '700' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 17 },
});
