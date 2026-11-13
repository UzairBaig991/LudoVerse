import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createPrivateRoom, PrivateRoom, setPrivateRoomReady, startPrivateRoom, subscribeToPrivateRoom } from '../services/rooms/privateRooms';
import { firebaseAuth } from '../services/firebase/client';
import { useGameStore } from '../store/gameStore';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ roomCode?: string | string[] }>();
  const roomCode = Array.isArray(params.roomCode) ? params.roomCode[0] : params.roomCode;
  const playerCount = useGameStore((state) => state.playerCount);
  const [room, setRoom] = useState<PrivateRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) return undefined;
    return subscribeToPrivateRoom(roomCode, setRoom, (subscriptionError) => setError(
      'code' in subscriptionError && subscriptionError.code === 'permission-denied'
        ? 'You are not a member of this room. Join it with the room code first.'
        : 'Could not load this room. Check your connection and try again.',
    ));
  }, [roomCode]);

  const currentPlayer = useMemo(
    () => room?.players.find((player) => player.uid === firebaseAuth?.currentUser?.uid),
    [room],
  );
  const canStart = Boolean(room && room.hostUid === firebaseAuth?.currentUser?.uid
    && room.players.length >= 2 && room.players.every((player) => player.ready));

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await createPrivateRoom(playerCount);
      router.replace({ pathname: '/room', params: { roomCode: result.roomCode } });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the room.');
    } finally {
      setBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!roomCode || !currentPlayer) return;
    setBusy(true);
    setError('');
    try {
      await setPrivateRoomReady(roomCode, !currentPlayer.ready);
    } catch (readyError) {
      setError(readyError instanceof Error ? readyError.message : 'Could not update your ready status.');
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!roomCode) return;
    setBusy(true);
    setError('');
    try {
      await startPrivateRoom(roomCode);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start the room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Private Room</Text>
        <Text style={styles.title}>{roomCode ? 'Room Lobby' : 'Create a room'}</Text>

        {!roomCode ? (
          <>
            <Text style={styles.subtitle}>Create a room for {playerCount} players, then share its code with your friends.</Text>
            <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} onPress={() => void create()} disabled={busy}>
              {busy ? <ActivityIndicator color="#10152A" /> : <Text style={styles.primaryButtonText}>Create Private Room</Text>}
            </TouchableOpacity>
          </>
        ) : !room && !error ? (
          <ActivityIndicator color="#FFD700" style={styles.loader} />
        ) : room ? (
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Room Code</Text>
              <Text selectable style={styles.code}>{room.roomCode}</Text>
              <Text style={styles.meta}>{room.players.length} of {room.playerCount} players</Text>
              <TouchableOpacity onPress={() => void Share.share({ message: `Join my LudoVerse room with code ${room.roomCode}` })}>
                <Text style={styles.shareText}>Share invite</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playerList}>
              {Array.from({ length: room.playerCount }, (_, seat) => {
                const player = room.players.find((item) => item.seat === seat);
                return (
                  <View key={seat} style={styles.playerRow}>
                    <Text style={styles.playerName}>{player?.displayName ?? `Waiting for player ${seat + 1}`}{player?.uid === room.hostUid ? ' · Host' : ''}</Text>
                    <Text style={[styles.readyText, !player?.ready && styles.notReady]}>{player ? player.ready ? 'Ready' : 'Not ready' : 'Open'}</Text>
                  </View>
                );
              })}
            </View>

            {room.status === 'playing' ? (
              <View style={styles.notice}>
                <Text style={styles.noticeTitle}>Room started</Text>
                <Text style={styles.noticeText}>Online turn synchronization is the next multiplayer milestone. Keep this room open while that is being connected.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={[styles.secondaryButton, (busy || !currentPlayer) && styles.disabled]} onPress={() => void toggleReady()} disabled={busy || !currentPlayer}>
                  <Text style={styles.secondaryButtonText}>{currentPlayer?.ready ? 'Mark Not Ready' : 'I’m Ready'}</Text>
                </TouchableOpacity>
                {room.hostUid === firebaseAuth?.currentUser?.uid ? (
                  <TouchableOpacity style={[styles.primaryButton, (!canStart || busy) && styles.disabled]} onPress={() => void start()} disabled={!canStart || busy}>
                    {busy ? <ActivityIndicator color="#10152A" /> : <Text style={styles.primaryButtonText}>Start Match</Text>}
                  </TouchableOpacity>
                ) : <Text style={styles.waitText}>Waiting for the host to start</Text>}
              </>
            )}
          </>
        ) : null}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  eyebrow: { color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 14 },
  subtitle: { color: '#D7E3FF', lineHeight: 22, marginBottom: 20 },
  loader: { marginVertical: 32 },
  codeCard: { backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, alignItems: 'center', marginBottom: 18 },
  codeLabel: { color: '#AFC5FF', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1 },
  code: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 3, marginTop: 8 },
  meta: { color: '#D7E3FF', marginTop: 10 },
  shareText: { color: '#FFD700', fontWeight: '700', marginTop: 14, padding: 6 },
  playerList: { marginBottom: 20 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  playerName: { color: '#FFFFFF', fontWeight: '700', flexShrink: 1 },
  readyText: { color: '#4CAF50', fontWeight: '700' },
  notReady: { color: '#FFCA70' },
  primaryButton: { backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 16, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 17 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  waitText: { color: '#B9C9FF', textAlign: 'center', marginTop: 10 },
  notice: { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.4)', borderWidth: 1, padding: 16, borderRadius: 16 },
  noticeTitle: { color: '#FFD700', fontWeight: '800', marginBottom: 6 },
  noticeText: { color: '#D7E3FF', lineHeight: 20 },
  error: { color: '#FF9B9B', marginTop: 16, lineHeight: 20 },
  backButton: { alignSelf: 'center', padding: 16, marginTop: 14 },
  backText: { color: '#B9C9FF', fontWeight: '700' },
});
