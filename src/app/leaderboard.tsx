import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

const tabs = ['Daily', 'Weekly', 'Monthly', 'Global'];

export default function LeaderboardScreen() {
  const { leaderboard } = useGameStore();

  return (
    <LinearGradient colors={['#10152A', '#151B35', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <View key={tab} style={styles.tabPill}>
              <Text style={styles.tabText}>{tab}</Text>
            </View>
          ))}
        </View>

        {leaderboard.map((entry, index) => (
          <View key={entry.name} style={styles.row}>
            <View style={styles.rankWrap}>
              <Text style={styles.rank}>{index + 1}</Text>
            </View>
            <View style={styles.nameWrap}>
              <View style={[styles.dot, { backgroundColor: entry.accent }]} />
              <Text style={styles.playerName}>{entry.name}</Text>
            </View>
            <Text style={styles.wins}>{entry.wins} wins</Text>
            <Text style={styles.rating}>{entry.rating}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 52 },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginBottom: 18 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  tabPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabText: { color: '#D7E3FF', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rankWrap: { width: 28, alignItems: 'center' },
  rank: { color: '#FFD700', fontWeight: '800' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  playerName: { color: '#FFFFFF', fontWeight: '700' },
  wins: { color: '#D7E3FF', marginRight: 10 },
  rating: { color: '#FFD700', fontWeight: '800' },
});
