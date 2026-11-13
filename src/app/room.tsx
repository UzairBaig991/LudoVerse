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
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
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
                <Text style={styles.noticeText}>The online game is ready. Everyone in the room can open the shared board.</Text>
                <TouchableOpacity style={styles.openGameButton} onPress={() => router.push({ pathname: '/game', params: { roomCode: room.roomCode } })}>
                  <Text style={styles.openGameText}>Open Online Game</Text>
                </TouchableOpacity>
              </View>
            ) : room.status === 'completed' ? (
              <View style={styles.notice}>
                <Text style={styles.noticeTitle}>Match complete</Text>
                <Text style={styles.noticeText}>{room.gameState?.players.find((player) => player.id === room.gameState?.winner)?.name ?? 'The winner'} won this match.</Text>
                <TouchableOpacity style={styles.openGameButton} onPress={() => router.push({ pathname: '/results', params: {
                  winner: room.gameState?.winner ?? 'red',
                  winnerName: room.gameState?.players.find((player) => player.id === room.gameState?.winner)?.name ?? 'Player',
                  online: '1',
                  roomCode: room.roomCode,
                } })}>
                  <Text style={styles.openGameText}>View Match Result</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.completedBoardButton} onPress={() => router.push({ pathname: '/game', params: { roomCode: room.roomCode, finalBoard: '1' } })}>
                  <Text style={styles.secondaryButtonText}>View Final Board</Text>
                </TouchableOpacity>
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
  eyebrow: { color: '#FFD45A', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 14 },
  subtitle: { color: '#F0D5E9', lineHeight: 22, marginBottom: 20 },
  loader: { marginVertical: 32 },
  codeCard: { backgroundColor: 'rgba(88,27,83,0.78)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,202,228,0.2)', padding: 20, alignItems: 'center', marginBottom: 18 },
  codeLabel: { color: '#EAB8E0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1 },
  code: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: 3, marginTop: 8 },
  meta: { color: '#F0D5E9', marginTop: 10 },
  shareText: { color: '#FFD45A', fontWeight: '700', marginTop: 14, padding: 6 },
  playerList: { marginBottom: 20 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,217,243,0.12)' },
  playerName: { color: '#FFFFFF', fontWeight: '700', flexShrink: 1 },
  readyText: { color: '#4CAF50', fontWeight: '700' },
  notReady: { color: '#FFCA70' },
  primaryButton: { backgroundColor: '#FFD45A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  primaryButtonText: { color: '#4B1A53', fontWeight: '800', fontSize: 17 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  waitText: { color: '#E8C5E8', textAlign: 'center', marginTop: 10 },
  notice: { backgroundColor: 'rgba(255,212,90,0.1)', borderColor: 'rgba(255,212,90,0.4)', borderWidth: 1, padding: 16, borderRadius: 16 },
  noticeTitle: { color: '#FFD45A', fontWeight: '800', marginBottom: 6 },
  noticeText: { color: '#F0D5E9', lineHeight: 20 },
  openGameButton: { alignSelf: 'flex-start', backgroundColor: '#FFD45A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 14 },
  openGameText: { color: '#4B1A53', fontWeight: '800' },
  completedBoardButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8 },
  error: { color: '#FF9B9B', marginTop: 16, lineHeight: 20 },
  backButton: { alignSelf: 'center', padding: 16, marginTop: 14 },
  backText: { color: '#B9C9FF', fontWeight: '700' },
});
