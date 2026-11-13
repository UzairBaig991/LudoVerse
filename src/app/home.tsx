import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

const quickStats = [
  { label: 'Coins', value: '12,480', color: '#FFD700' },
  { label: 'Wins', value: '248', color: '#4CAF50' },
  { label: 'Rank', value: '#18', color: '#2196F3' },
];

const gameModes = [
  { label: 'Quick Match', value: 'Online', route: '/matchmaking' },
  { label: 'Friends', value: 'Private', route: '/room' },
  { label: 'Offline', value: '4 players', route: '/game' },
  { label: 'Computer', value: 'Bot', route: '/game' },
];

export default function HomeScreen() {
  const { profile } = useGameStore();

  return (
    <LinearGradient colors={['#0F172A', '#10152A', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{profile.username.split(' ')[0]}.</Text>
          </View>
          <View style={styles.iconStack}>
            <TouchableOpacity style={styles.iconBubble} onPress={() => router.push('/profile')} />
            <TouchableOpacity style={styles.iconBubble} onPress={() => router.push('/leaderboard')} />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar} />
          <View style={styles.profileTextWrap}>
            <Text style={styles.playerName}>{profile.username}</Text>
            <Text style={styles.playerStatus}>Level {profile.level} • Pro Ludo Player</Text>
          </View>
          <Text style={styles.rankChip}>#{profile.level}</Text>
        </View>

        <View style={styles.statsRow}>
          {quickStats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { borderColor: stat.color }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/game-mode')}>
          <Text style={styles.primaryButtonText}>Play Now</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          {gameModes.map((mode, index) => (
            <TouchableOpacity
              key={mode.label}
              style={[styles.modeCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
              onPress={() => router.push(mode.route)}
            >
              <Text style={styles.modeTitle}>{mode.label}</Text>
              <Text style={styles.modeValue}>{mode.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.rewardBox} onPress={() => router.push('/shop')}>
            <Text style={styles.rewardText}>Daily Rewards</Text>
            <Text style={styles.rewardSub}>+250 coins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rewardBox} onPress={() => router.push('/leaderboard')}>
            <Text style={styles.rewardText}>Leaderboard</Text>
            <Text style={styles.rewardSub}>Top 5 live</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 54, paddingBottom: 20 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: { color: '#D7E3FF', fontSize: 14, marginBottom: 2 },
  username: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  iconStack: { flexDirection: 'row', gap: 10 },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginLeft: 6,
  },
  profileCard: {
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    marginRight: 14,
  },
  profileTextWrap: { flex: 1 },
  playerName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  playerStatus: { color: '#ABBAE8', fontSize: 12, marginTop: 4 },
  rankChip: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    color: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '800',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { marginTop: 6, fontSize: 11, color: '#D7E3FF', textTransform: 'uppercase', letterSpacing: 0.8 },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  primaryButtonText: { color: '#10152A', fontWeight: '800', fontSize: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modeCard: {
    width: '48%',
    backgroundColor: 'rgba(17,24,39,0.7)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  cardLeft: { marginRight: '2%' },
  cardRight: { marginLeft: '2%' },
  modeTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modeValue: { color: '#FFD700', fontWeight: '700', fontSize: 13, marginTop: 8 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginHorizontal: 4,
  },
  rewardText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  rewardSub: { marginTop: 8, color: '#9FB7F2', fontSize: 12 },
});
