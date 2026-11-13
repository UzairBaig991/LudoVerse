import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { playSound } from '../lib/audio';
import {
  GameState,
  PLAYER_META,
  TRACK,
  createGameState,
  getLegalTokens,
  getTokenDisplayPosition,
  moveToken,
  rollForCurrentPlayer,
  Token,
} from '../lib/ludo';
import { useGameStore } from '../store/gameStore';

const BOARD_SIZE = 320;

function TokenChip({ token, color, selectable, onPress }: { token: Token; color: string; selectable: boolean; onPress: () => void }) {
  const position = getTokenDisplayPosition(token);
  const x = (position.x / 100) * BOARD_SIZE;
  const y = (position.y / 100) * BOARD_SIZE;
  const animated = useRef(new Animated.ValueXY({ x, y })).current;

  useEffect(() => {
    Animated.spring(animated, {
      toValue: { x, y },
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [animated, x, y]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX: animated.x }, { translateY: animated.y }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${token.color} token ${token.index + 1}${selectable ? ', legal move' : ''}`}
        disabled={!selectable}
        onPress={onPress}
        style={[styles.token, { backgroundColor: color, borderColor: selectable ? '#FFD700' : '#FFFFFF', borderWidth: selectable ? 3 : 2 }]}
      />
    </Animated.View>
  );
}

export default function GameScreen() {
  const playerCount = useGameStore((state) => state.playerCount);
  const [game, setGame] = useState<GameState>(() => createGameState(playerCount));
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [message, setMessage] = useState('Roll the dice to begin the match.');
  const diceSpin = useRef(new Animated.Value(0)).current;

  const currentPlayer = game.players[game.turnIndex]!;

  useEffect(() => {
    if (winner) {
      router.replace({ pathname: '/results', params: { winner } });
    }
  }, [winner]);

  const allTokens = useMemo(() => game.players.flatMap((player) => player.tokens), [game.players]);

  const rollDice = async () => {
    if (rolling || winner || game.phase !== 'rolling') return;
    const nextGame = rollForCurrentPlayer(game);
    const nextRoll = nextGame.dice!;
    setRolling(true);
    setDice(nextRoll);
    setMessage(`${PLAYER_META[currentPlayer.id].name} rolled ${nextRoll}.`);
    setGame(nextGame);

    Animated.sequence([
      Animated.timing(diceSpin, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(diceSpin, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    if (soundOn) {
      await playSound('roll');
    }

    const movable = getLegalTokens(currentPlayer, nextRoll);
    if (!movable.length) {
      setTimeout(() => {
        setRolling(false);
        setMessage(`${PLAYER_META[currentPlayer.id].name} has no legal move. ${PLAYER_META[nextGame.players[nextGame.turnIndex]!.id].name} is up next.`);
      }, 620);
      return;
    }
    setRolling(false);
    setMessage(movable.length === 1 ? 'Tap the highlighted token to move.' : 'Choose one of your highlighted tokens.');
  };

  const selectToken = async (token: Token) => {
    if (rolling || game.phase !== 'moving' || !getLegalTokens(currentPlayer, game.dice!).some((legal) => legal.id === token.id)) return;
    const nextGame = moveToken(game, token.id);
    setGame(nextGame);
    setRolling(true);
    if (soundOn) await playSound('move');
    setTimeout(() => {
      if (nextGame.winner) {
        setWinner(nextGame.winner);
        if (soundOn) playSound('win');
        setMessage(`${PLAYER_META[nextGame.winner].name} wins!`);
      } else {
        const nextPlayer = nextGame.players[nextGame.turnIndex]!;
        setMessage(nextGame.lastCapture
          ? `${PLAYER_META[nextPlayer.id].name} captured a token${nextGame.turnIndex === game.turnIndex ? ' and gets another turn' : ''}.`
          : `${PLAYER_META[nextPlayer.id].name} is up next.`);
      }
      setRolling(false);
    }, 700);
  };

  const boardRotation = diceSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#0F172A', '#10152A', '#1A254A']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/home')}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
          <Text style={styles.statusText}>Turn {game.turnIndex + 1} of {game.players.length}</Text>
          <Pressable onPress={() => setSoundOn((value) => !value)}>
            <Text style={styles.soundText}>{soundOn ? 'Sound On' : 'Mute'}</Text>
          </Pressable>
        </View>

        <View style={styles.playerBar}>
          {game.players.map((player) => (
            <View key={player.id} style={[styles.playerPill, { backgroundColor: `${PLAYER_META[player.id].accent}22` }]}> 
              <Text style={[styles.playerColor, { color: PLAYER_META[player.id].accent }]}>{PLAYER_META[player.id].name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.boardWrap}>
          <LinearGradient colors={['#1A254A', '#10152A']} style={styles.board}>
            <View style={[styles.quadrant, styles.redQuadrant]} />
            <View style={[styles.quadrant, styles.greenQuadrant]} />
            <View style={[styles.quadrant, styles.yellowQuadrant]} />
            <View style={[styles.quadrant, styles.blueQuadrant]} />

            {TRACK.map((point, index) => (
              <View key={`${point.x}-${point.y}-${index}`} style={[styles.trackDot, { left: `${point.x}%`, top: `${point.y}%` }]} />
            ))}

            <View style={styles.centerPath} />

            {allTokens.map((token) => (
              <TokenChip key={token.id} token={token} color={PLAYER_META[token.color].accent}
                selectable={game.phase === 'moving' && getLegalTokens(currentPlayer, game.dice!).some((legal) => legal.id === token.id)}
                onPress={() => selectToken(token)}
              />
            ))}
          </LinearGradient>
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.dicePanel}>
            <Text style={styles.label}>Dice</Text>
            <Animated.View style={[styles.dice, { transform: [{ rotate: boardRotation }] }]}>
              <Text style={styles.diceValue}>{dice}</Text>
            </Animated.View>
            <Pressable style={[styles.rollButton, game.phase !== 'rolling' && styles.disabledButton]} onPress={rollDice} disabled={rolling || game.phase !== 'rolling'}>
              <Text style={styles.rollButtonText}>{rolling ? 'Please wait...' : game.phase === 'moving' ? 'Choose a token' : 'Roll Dice'}</Text>
            </Pressable>
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.label}>Now playing</Text>
            <Text style={styles.playerName}>{PLAYER_META[currentPlayer.id].name}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 48, paddingBottom: 18 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  exitText: { color: '#FFCDD2', fontWeight: '700' },
  statusText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  soundText: { color: '#B8C7FF', fontWeight: '700' },
  playerBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  playerPill: { flex: 1, marginHorizontal: 4, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  playerColor: { fontWeight: '700' },
  boardWrap: { alignItems: 'center', justifyContent: 'center' },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.09)',
    position: 'relative',
  },
  quadrant: {
    position: 'absolute',
    width: '42%',
    height: '42%',
    borderRadius: 28,
    opacity: 0.74,
  },
  redQuadrant: { top: 0, left: 0, backgroundColor: 'rgba(244, 67, 54, 0.22)' },
  greenQuadrant: { top: 0, right: 0, backgroundColor: 'rgba(76, 175, 80, 0.22)' },
  yellowQuadrant: { bottom: 0, left: 0, backgroundColor: 'rgba(255, 193, 7, 0.22)' },
  blueQuadrant: { bottom: 0, right: 0, backgroundColor: 'rgba(33, 150, 243, 0.22)' },
  trackDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.42)',
    marginLeft: -5,
    marginTop: -5,
  },
  centerPath: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -22,
    backgroundColor: '#FFD700',
    opacity: 0.75,
  },
  token: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    top: 0,
    left: 0,
  },
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 18,
    gap: 12,
  },
  dicePanel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    alignItems: 'center',
  },
  infoPanel: {
    flex: 1.2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  label: { color: '#ABBAE8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1 },
  dice: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  diceValue: { color: '#10152A', fontWeight: '800', fontSize: 28 },
  rollButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rollButtonText: { color: '#FFFFFF', fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  playerName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 10 },
  message: { marginTop: 8, color: '#DCE8FF', fontSize: 13, lineHeight: 18 },
});
