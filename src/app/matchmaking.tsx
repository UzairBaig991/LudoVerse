import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cancelQuickMatch, findQuickMatch, QuickMatchTicket, subscribeToQuickMatchTicket } from '../services/rooms/privateRooms';
import { firebaseAuth } from '../services/firebase/client';
import { useGameStore } from '../store/gameStore';

export default function MatchmakingScreen() {
  const playerCount = useGameStore((state) => state.playerCount);
  const uid = firebaseAuth?.currentUser?.uid;
  const [ticket, setTicket] = useState<QuickMatchTicket | null>(null);
  const [busy, setBusy] = useState(Boolean(uid));
  const [error, setError] = useState('');
  const [searchExpired, setSearchExpired] = useState(false);
  const navigated = useRef(false);

  const openRoom = useCallback((roomCode: string) => {
    if (navigated.current) return;
    navigated.current = true;
    router.replace({ pathname: '/room', params: { roomCode } });
  }, []);

  const search = useCallback(async () => {
    try {
      const result = await findQuickMatch(playerCount);
      if (result.status === 'matched') openRoom(result.roomCode);
      else setTicket({
        uid: uid ?? '',
        displayName: firebaseAuth?.currentUser?.displayName ?? 'You',
        playerCount,
        status: 'waiting',
        position: result.position,
        expiresAt: { toMillis: () => result.expiresAt },
      });
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Could not find a match.');
    } finally {
      setBusy(false);
    }
  }, [openRoom, playerCount, uid]);

  useEffect(() => {
    if (!uid) return undefined;
    const unsubscribe = subscribeToQuickMatchTicket(uid, (nextTicket) => {
      setTicket(nextTicket);
      if (nextTicket?.status === 'matched' && nextTicket.roomCode) openRoom(nextTicket.roomCode);
      if (nextTicket?.status === 'expired') {
        setSearchExpired(true);
        setBusy(false);
      }
    }, (subscriptionError) => setError(subscriptionError.message));
    const initialSearch = setTimeout(() => void search(), 0);
    return () => {
      clearTimeout(initialSearch);
      unsubscribe();
    };
  }, [openRoom, search, uid]);

  const expiresAt = ticket?.status === 'waiting' ? ticket.expiresAt?.toMillis() : undefined;
  useEffect(() => {
    if (!expiresAt || ticket?.status !== 'waiting') return undefined;
    const timer = setTimeout(() => {
      setSearchExpired(true);
      setBusy(false);
    }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt, openRoom, ticket?.status]);

  const cancelSearch = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await cancelQuickMatch();
      if (result.status === 'matched') openRoom(result.roomCode);
      else router.back();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the search.');
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Quick Match</Text>
        <Text style={styles.title}>{searchExpired ? 'Search expired' : `Finding ${playerCount} players`}</Text>
        {!uid ? (
          <View style={styles.card}>
            <Text style={styles.message}>Sign in with a Firebase account before joining online matchmaking.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth')}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : searchExpired ? (
          <View style={styles.card}>
            <Text style={styles.message}>No match was found in time. Start a new search when you’re ready.</Text>
            <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} onPress={() => { setBusy(true); setError(''); setSearchExpired(false); void search(); }} disabled={busy}>
              {busy ? <ActivityIndicator color="#10152A" /> : <Text style={styles.primaryButtonText}>Search Again</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <ActivityIndicator color="#FFD700" size="large" />
            <Text style={styles.message}>Searching for a {playerCount}-player match…</Text>
            <Text style={styles.detail}>We’ll open the room as soon as enough players join.</Text>
            <TouchableOpacity style={[styles.secondaryButton, (busy || !ticket) && styles.disabled]} onPress={() => void cancelSearch()} disabled={busy || !ticket}>
              <Text style={styles.secondaryButtonText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!uid ? <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Back</Text></TouchableOpacity> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  eyebrow: { color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 20 },
  card: { backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 22, alignItems: 'center', gap: 14 },
  message: { color: '#D7E3FF', textAlign: 'center', lineHeight: 22, fontSize: 15 },
  detail: { color: '#AFC5FF', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  primaryButton: { alignSelf: 'stretch', backgroundColor: '#FFD700', borderRadius: 14, minHeight: 52, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 16 },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: '#FF9B9B', lineHeight: 20, marginTop: 16 },
  backButton: { alignSelf: 'center', padding: 16, marginTop: 14 },
  backText: { color: '#B9C9FF', fontWeight: '700' },
});
