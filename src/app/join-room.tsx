import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function JoinRoomScreen() {
  const { joinRoom } = useGameStore();
  const [code, setCode] = useState('');

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Play With Friends</Text>
        <Text style={styles.title}>Join a room</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Room code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter room code"
            placeholderTextColor="#8FA6D8"
            style={styles.input}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            joinRoom(code);
            router.push('/game');
          }}
        >
          <Text style={styles.primaryButtonText}>Join Match</Text>
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
  card: {
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 22,
    marginBottom: 20,
  },
  label: { color: '#AFC5FF', fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2C4A7B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 1.6,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 17 },
});
