import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRecentMatches, MatchRecord } from '../lib/matchHistory';
import { PLAYER_META } from '../lib/ludo';

export default function MatchHistoryScreen() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getRecentMatches()
      .then((rows) => {
        if (active) {
          setMatches(rows);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Your games</Text>
        <Text style={styles.title}>Match history</Text>
        {loading ? <ActivityIndicator color="#FFD700" /> : null}
        {error ? <Text style={styles.empty}>Match history could not be loaded.</Text> : null}
        {!loading && !error && matches.length === 0 ? <Text style={styles.empty}>Completed offline matches will appear here.</Text> : null}
        {matches.map((match) => (
          <View key={match.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={[styles.winner, { color: PLAYER_META[match.winner].accent }]}>{PLAYER_META[match.winner].name} won</Text>
              <Text style={styles.date}>{new Date(match.finishedAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.detail}>{match.mode} · {match.playerCount} players</Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingHorizontal: 22, paddingTop: 56, paddingBottom: 32 },
  eyebrow: { color: '#FFD700', fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  winner: { fontSize: 16, fontWeight: '800' },
  date: { color: '#9FB7F2', fontSize: 12 },
  detail: { color: '#D7E3FF', fontSize: 13, marginTop: 8 },
  empty: { color: '#B9C9FF', fontSize: 15, lineHeight: 22, marginTop: 12 },
});
