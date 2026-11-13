import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';

export default function ProfileScreen() {
  const { profile } = useGameStore();

  return (
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{profile.username}</Text>
            <Text style={styles.meta}>Player ID • LV-546312</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.card}><Text style={styles.value}>{profile.matches}</Text><Text style={styles.label}>Matches</Text></View>
          <View style={styles.card}><Text style={styles.value}>{profile.wins}</Text><Text style={styles.label}>Wins</Text></View>
          <View style={styles.card}><Text style={styles.value}>{profile.winRate}%</Text><Text style={styles.label}>Win %</Text></View>
          <View style={styles.card}><Text style={styles.value}>L{profile.level}</Text><Text style={styles.label}>Level</Text></View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <Text style={styles.badges}>🏆 12 streaks • 🎲 Dice Master • ⚡ Fast Climber</Text>
        </View>

        <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/match-history')}>
          <Text style={styles.historyButtonText}>View match history</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 52 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFD700', marginRight: 16 },
  headerText: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  meta: { color: '#AFC5FF', marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 12,
  },
  value: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  label: { color: '#AFC5FF', marginTop: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  summaryCard: {
    marginTop: 12,
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  badges: { color: '#D7E3FF', lineHeight: 24 },
  historyButton: { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)', paddingVertical: 14, alignItems: 'center' },
  historyButtonText: { color: '#FFD700', fontWeight: '800' },
});
