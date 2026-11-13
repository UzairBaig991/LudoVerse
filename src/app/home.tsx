import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MatchMode, useGameStore } from '../store/gameStore';

type GameOption = {
  title: string;
  detail: string;
  icon: string;
  accent: string;
  mode: MatchMode;
};

const gameOptions: GameOption[] = [
  { title: 'Quick Match', detail: 'Find players online', icon: '🎲', accent: '#39D98A', mode: 'Quick Match' },
  { title: 'Play with friends', detail: 'Create or join a room', icon: '👥', accent: '#60A5FA', mode: 'Private Room' },
  { title: 'Local game', detail: 'Pass and play together', icon: '🏠', accent: '#FFC857', mode: 'Local Pass-and-Play' },
  { title: 'Play vs computer', detail: 'Practice your strategy', icon: '🤖', accent: '#C084FC', mode: 'Play Against Computer' },
];

const modeRoutes: Record<MatchMode, '/matchmaking' | '/room' | '/join-room' | '/game-mode'> = {
  'Quick Match': '/matchmaking',
  'Private Room': '/room',
  'Play With Friends': '/join-room',
  'Offline Multiplayer': '/game-mode',
  'Play Against Computer': '/game-mode',
  'Local Pass-and-Play': '/game-mode',
};

function BoardPreview() {
  return (
    <View accessible accessibilityLabel="Four-color Ludo board preview" style={styles.boardPreview}>
      <View style={[styles.boardQuarter, styles.boardGreen]} />
      <View style={[styles.boardQuarter, styles.boardYellow]} />
      <View style={[styles.boardQuarter, styles.boardRed]} />
      <View style={[styles.boardQuarter, styles.boardBlue]} />
      <View style={styles.boardCenter}><Text style={styles.boardStar}>✦</Text></View>
      <View style={[styles.previewToken, styles.tokenOne]} />
      <View style={[styles.previewToken, styles.tokenTwo]} />
      <View style={[styles.previewToken, styles.tokenThree]} />
      <View style={[styles.previewToken, styles.tokenFour]} />
    </View>
  );
}

export default function HomeScreen() {
  const profile = useGameStore((state) => state.profile);
  const setSelectedMode = useGameStore((state) => state.setSelectedMode);
  const firstName = profile.username.trim().split(/\s+/)[0] || 'Player';

  const openMode = (mode: MatchMode) => {
    setSelectedMode(mode);
    router.push(modeRoutes[mode]);
  };

  return (
    <LinearGradient colors={['#24102F', '#351345', '#551A4C']} style={styles.background}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open player profile"
              onPress={() => router.push('/profile')}
              style={styles.playerSummary}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
                <View style={styles.levelBadge}><Text style={styles.levelText}>{profile.level}</Text></View>
              </View>
              <View style={styles.playerCopy}>
                <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
                <Text numberOfLines={1} style={styles.playerName}>{firstName}</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${profile.coins.toLocaleString()} coins. Open shop`}
              onPress={() => router.push('/shop')}
              style={styles.coinPill}
            >
              <Text style={styles.coinIcon}>◉</Text>
              <Text style={styles.coinBalance}>{profile.coins.toLocaleString()}</Text>
              <Text style={styles.coinAdd}>+</Text>
            </Pressable>
          </View>

          <LinearGradient
            colors={['#92227F', '#B71D79', '#6F1E70']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View pointerEvents="none" style={styles.heroOrb} />
            <View style={styles.heroCopy}>
              <View style={styles.heroTag}><Text style={styles.heroTagText}>THE CLASSIC BOARD BATTLE</Text></View>
              <Text style={styles.heroTitle}>Ready to{ '\n' }roll?</Text>
              <Text style={styles.heroSubtitle}>Your next win starts here.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/game-mode')}
                style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
              >
                <Text style={styles.playButtonText}>PLAY NOW</Text>
                <Text style={styles.playArrow}>›</Text>
              </Pressable>
            </View>
            <BoardPreview />
          </LinearGradient>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Choose your game</Text>
              <Text style={styles.sectionHint}>Pick a table and jump in</Text>
            </View>
            <Text style={styles.diceMark}>⚄</Text>
          </View>

          <View style={styles.modeGrid}>
            {gameOptions.map((option, index) => (
              <Pressable
                key={option.title}
                accessibilityRole="button"
                accessibilityLabel={`${option.title}. ${option.detail}`}
                onPress={() => openMode(option.mode)}
                style={({ pressed }) => [
                  styles.modeCard,
                  index % 2 === 0 ? styles.leftCard : styles.rightCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.modeIconWrap, { backgroundColor: `${option.accent}20` }]}>
                  <Text style={styles.modeIcon}>{option.icon}</Text>
                </View>
                <View style={styles.modeTextWrap}>
                  <Text numberOfLines={1} style={styles.modeTitle}>{option.title}</Text>
                  <Text numberOfLines={1} style={styles.modeDetail}>{option.detail}</Text>
                </View>
                <View style={[styles.modeAccent, { backgroundColor: option.accent }]} />
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/leaderboard')}
            style={({ pressed }) => [styles.leaderboardCard, pressed && styles.pressed]}
          >
            <LinearGradient colors={['#6B236D', '#421B58']} style={styles.leaderboardGradient}>
              <View style={styles.trophyWrap}><Text style={styles.trophy}>♛</Text></View>
              <View style={styles.leaderboardCopy}>
                <Text style={styles.leaderboardTitle}>Climb the leaderboard</Text>
                <Text style={styles.leaderboardDetail}>See how you stack up with other players</Text>
              </View>
              <Text style={styles.leaderboardArrow}>›</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Text style={[styles.navIcon, styles.activeNavIcon]}>⌂</Text>
            <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/match-history')} style={styles.navItem}>
            <Text style={styles.navIcon}>◷</Text>
            <Text style={styles.navLabel}>Matches</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/leaderboard')} style={styles.navItem}>
            <Text style={styles.navIcon}>♛</Text>
            <Text style={styles.navLabel}>Ranks</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/shop')} style={styles.navItem}>
            <Text style={styles.navIcon}>▱</Text>
            <Text style={styles.navLabel}>Shop</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={styles.navItem}>
            <Text style={styles.navIcon}>◉</Text>
            <Text style={styles.navLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  playerSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5942A8',
    borderWidth: 2,
    borderColor: '#A58CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  levelBadge: { position: 'absolute', bottom: -5, minWidth: 21, borderRadius: 8, backgroundColor: '#F7C64B', paddingHorizontal: 4, alignItems: 'center' },
  levelText: { color: '#352765', fontSize: 10, fontWeight: '900' },
  playerCopy: { flex: 1 },
  welcomeLabel: { color: '#A6A8D1', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  playerName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 3 },
  coinPill: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,208,91,0.42)',
    backgroundColor: 'rgba(255,198,71,0.12)',
    paddingLeft: 10,
    paddingRight: 5,
  },
  coinIcon: { color: '#FFD05A', fontSize: 19, marginRight: 5 },
  coinBalance: { color: '#FFF5D6', fontSize: 13, fontWeight: '900' },
  coinAdd: { color: '#34245F', backgroundColor: '#FFD05A', width: 24, height: 24, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', borderRadius: 12, fontSize: 18, fontWeight: '900', marginLeft: 8 },
  heroCard: { minHeight: 210, borderRadius: 26, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 18, marginBottom: 26, borderWidth: 1, borderColor: 'rgba(212,196,255,0.28)' },
  heroOrb: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -92, top: -90, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroCopy: { flex: 1, zIndex: 1 },
  heroTag: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
  heroTagText: { color: '#E1D7FF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 32, fontWeight: '900' },
  heroSubtitle: { color: '#DED6FF', fontSize: 11, marginTop: 5, marginBottom: 12 },
  playButton: { minWidth: 124, height: 40, borderRadius: 14, backgroundColor: '#FFD05A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, elevation: 3 },
  playButtonText: { color: '#30235B', fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  playArrow: { color: '#30235B', fontSize: 22, lineHeight: 24, fontWeight: '800', marginLeft: 9, marginTop: -2 },
  boardPreview: { width: 105, height: 105, borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFDF5', borderWidth: 4, borderColor: '#FFF9E8', transform: [{ rotate: '6deg' }], elevation: 8, marginLeft: 8 },
  boardQuarter: { position: 'absolute', width: '50%', height: '50%' },
  boardGreen: { top: 0, left: 0, backgroundColor: '#43B979' },
  boardYellow: { top: 0, right: 0, backgroundColor: '#F3C74F' },
  boardRed: { bottom: 0, left: 0, backgroundColor: '#E64B58' },
  boardBlue: { bottom: 0, right: 0, backgroundColor: '#4B8FE7' },
  boardCenter: { position: 'absolute', left: '36%', top: '36%', width: '28%', height: '28%', borderRadius: 10, backgroundColor: '#FFFDF5', alignItems: 'center', justifyContent: 'center' },
  boardStar: { color: '#7255C8', fontSize: 19, fontWeight: '900' },
  previewToken: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFDF5', borderWidth: 2, borderColor: 'rgba(35,31,65,0.35)' },
  tokenOne: { top: 12, left: 12 },
  tokenTwo: { top: 12, right: 12 },
  tokenThree: { bottom: 12, left: 12 },
  tokenFour: { bottom: 12, right: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  sectionHint: { color: '#A8A9CA', fontSize: 11, marginTop: 3 },
  diceMark: { color: '#F8C95B', fontSize: 25 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 7 },
  modeCard: { width: '48.5%', minHeight: 108, backgroundColor: 'rgba(105,30,100,0.78)', borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,213,92,0.16)', padding: 12, marginBottom: 11, overflow: 'hidden' },
  leftCard: { marginRight: '1.5%' },
  rightCard: { marginLeft: '1.5%' },
  modeIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  modeIcon: { fontSize: 19 },
  modeTextWrap: { flex: 1 },
  modeTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  modeDetail: { color: '#A7A8C9', fontSize: 9, marginTop: 4 },
  modeAccent: { position: 'absolute', width: 4, height: 34, right: 0, top: 14, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  leaderboardCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(177,156,255,0.15)' },
  leaderboardGradient: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 12 },
  trophyWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,208,90,0.14)', marginRight: 11 },
  trophy: { color: '#FFD05A', fontSize: 24 },
  leaderboardCopy: { flex: 1 },
  leaderboardTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  leaderboardDetail: { color: '#AAABCA', fontSize: 9, marginTop: 4 },
  leaderboardArrow: { color: '#D0C2FF', fontSize: 27, paddingHorizontal: 4 },
  bottomNav: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,195,240,0.14)', backgroundColor: 'rgba(42,14,52,0.97)', paddingBottom: 7, paddingTop: 6 },
  navItem: { minWidth: 62, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#898BAF', fontSize: 21, lineHeight: 25 },
  activeNavIcon: { color: '#FFD05A' },
  navLabel: { color: '#898BAF', fontSize: 9, fontWeight: '700', marginTop: 2 },
  activeNavLabel: { color: '#FFD05A' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
