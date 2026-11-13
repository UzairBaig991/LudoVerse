import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { joinPrivateRoom } from '../services/rooms/privateRooms';

export default function JoinRoomScreen() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const join = async () => {
    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(normalizedCode)) {
      setError('Enter the 8-character room code.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await joinPrivateRoom(normalizedCode);
      router.replace({ pathname: '/room', params: { roomCode: result.roomCode } });
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join the room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Play With Friends</Text>
        <Text style={styles.title}>Join a room</Text>
        <Text style={styles.subtitle}>Enter the invite code shared by the room host.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Room code</Text>
          <TextInput
            value={code}
            onChangeText={(value) => { setCode(value.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()); setError(''); }}
            placeholder="8-character code"
            placeholderTextColor="#8FA6D8"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            accessibilityLabel="Room code"
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.primaryButton, (busy || code.length !== 8) && styles.disabled]} onPress={() => void join()} disabled={busy || code.length !== 8}>
          {busy ? <ActivityIndicator color="#10152A" /> : <Text style={styles.primaryButtonText}>Join Room</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  eyebrow: { color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#B9C9FF', lineHeight: 20, marginBottom: 20 },
  card: { backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 22, marginBottom: 16 },
  label: { color: '#AFC5FF', fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#2C4A7B', paddingHorizontal: 16, paddingVertical: 14, color: '#FFFFFF', fontSize: 22, letterSpacing: 2.4, textAlign: 'center' },
  error: { color: '#FF9B9B', marginBottom: 14, lineHeight: 20 },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 17 },
  disabled: { opacity: 0.5 },
  backButton: { alignSelf: 'center', padding: 16, marginTop: 10 },
  backText: { color: '#B9C9FF', fontWeight: '700' },
});
