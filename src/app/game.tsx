import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { playSound } from '../lib/audio';
import { chooseBotMove } from '../lib/bot';
import { recordLocalMatch } from '../lib/matchHistory';
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
import { useSettingsStore } from '../store/settingsStore';

function TokenChip({ token, color, boardSize, reducedMotion, selectable, onPress }: { token: Token; color: string; boardSize: number; reducedMotion: boolean; selectable: boolean; onPress: () => void }) {
  const position = getTokenDisplayPosition(token);
  const tokenSize = Math.max(14, boardSize * 0.0625);
  const x = (position.x / 100) * boardSize - tokenSize / 2;
  const y = (position.y / 100) * boardSize - tokenSize / 2;
  const [animated] = useState(() => new Animated.ValueXY({ x, y }));

  useEffect(() => {
    if (reducedMotion) {
      animated.setValue({ x, y });
      return;
    }
    Animated.spring(animated, {
      toValue: { x, y },
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [animated, reducedMotion, x, y]);

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
        style={[styles.token, { width: tokenSize, height: tokenSize, borderRadius: tokenSize / 2, backgroundColor: color, borderColor: selectable ? '#FFD700' : '#FFFFFF', borderWidth: selectable ? 3 : 2 }]}
      />
    </Animated.View>
  );
}

export default function GameScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const boardSize = Math.max(180, Math.min(windowWidth - 36, windowHeight * 0.42, 420));
  const playerCount = useGameStore((state) => state.playerCount);
  const selectedMode = useGameStore((state) => state.selectedMode);
  const botDifficulty = useGameStore((state) => state.botDifficulty);
  const soundOn = useSettingsStore((state) => state.soundEnabled);
  const toggleSound = useSettingsStore((state) => state.toggleSound);
  const [game, setGame] = useState<GameState>(() => createGameState(selectedMode === 'Play Against Computer' ? 2 : playerCount));
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [botCycle, setBotCycle] = useState(0);
  const [winner, setWinner] = useState<GameState['winner']>(null);
  const [message, setMessage] = useState('Roll the dice to begin the match.');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [diceSpin] = useState(() => new Animated.Value(0));
  const botProcessing = useRef(false);
  const matchRecorded = useRef(false);

  const currentPlayer = game.players[game.turnIndex]!;
  const isBotTurn = selectedMode === 'Play Against Computer' && currentPlayer.id === 'green';

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const animateDiceRoll = useCallback(() => {
    if (reducedMotion) {
      diceSpin.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.timing(diceSpin, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(diceSpin, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [diceSpin, reducedMotion]);

  useEffect(() => {
    if (!winner || matchRecorded.current) return;
    matchRecorded.current = true;
    void recordLocalMatch({
      winner,
      mode: selectedMode,
      playerCount: game.players.length,
      finishedAt: new Date().toISOString(),
    }).catch((error: unknown) => {
      console.warn('Could not save local match history:', error);
    }).finally(() => {
      router.replace({ pathname: '/results', params: { winner } });
    });
  }, [game.players.length, selectedMode, winner]);

  const allTokens = useMemo(() => game.players.flatMap((player) => player.tokens), [game.players]);

  useEffect(() => {
    if (!isBotTurn || game.phase !== 'rolling' || winner || botProcessing.current) return;
    botProcessing.current = true;
    const timer = setTimeout(async () => {
      const rolled = rollForCurrentPlayer(game);
      const roll = rolled.dice ?? 1;
      setDice(roll);
      setGame(rolled);
      setMessage(`Bot rolled ${roll}.`);
      animateDiceRoll();
      if (soundOn) await playSound('roll');

      if (rolled.phase === 'moving') {
        const tokenId = chooseBotMove(rolled, botDifficulty);
        if (tokenId) {
          await new Promise((resolve) => setTimeout(resolve, 520));
          const moved = moveToken(rolled, tokenId);
          setGame(moved);
          if (soundOn) await playSound(moved.lastCapture ? 'capture' : 'move');
          if (moved.winner) {
            setWinner(moved.winner);
            if (soundOn) playSound('win');
            setMessage('Bot wins the match.');
          } else {
            setMessage(moved.lastCapture ? 'Bot captured one of your tokens.' : 'Bot moved a token.');
          }
        }
      } else {
        setMessage(roll === 6 ? 'Bot has no legal move and rolls again.' : 'Bot has no legal move. Your turn.');
      }
      botProcessing.current = false;
      setRolling(false);
      setBotCycle((cycle) => cycle + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [animateDiceRoll, botCycle, botDifficulty, game, isBotTurn, soundOn, winner]);

  const rollDice = async () => {
    if (rolling || winner || game.phase !== 'rolling') return;
    const nextGame = rollForCurrentPlayer(game);
    const nextRoll = nextGame.dice!;
    setRolling(true);
    setDice(nextRoll);
    setMessage(`${PLAYER_META[currentPlayer.id].name} rolled ${nextRoll}.`);
    setGame(nextGame);

    animateDiceRoll();

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
    if (soundOn) await playSound(nextGame.lastCapture ? 'capture' : 'move');
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
          <Pressable onPress={toggleSound}>
            <Text style={styles.soundText}>{soundOn ? 'Sound On' : 'Mute'}</Text>
          </Pressable>
        </View>

        <View style={styles.playerBar}>
          {game.players.map((player) => (
            <View key={player.id} style={[styles.playerPill, { backgroundColor: `${PLAYER_META[player.id].accent}22` }]}> 
              <Text style={[styles.playerColor, { color: PLAYER_META[player.id].accent }]}>{selectedMode === 'Play Against Computer' && player.id === 'green' ? 'Bot' : PLAYER_META[player.id].name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.boardWrap}>
          <LinearGradient colors={['#1A254A', '#10152A']} style={[styles.board, { width: boardSize, height: boardSize }]}>
            <View style={[styles.quadrant, styles.redQuadrant]} />
            <View style={[styles.quadrant, styles.greenQuadrant]} />
            <View style={[styles.quadrant, styles.yellowQuadrant]} />
            <View style={[styles.quadrant, styles.blueQuadrant]} />

            {TRACK.map((point, index) => (
              <View key={`${point.x}-${point.y}-${index}`} style={[styles.trackDot, { width: boardSize / 32, height: boardSize / 32, borderRadius: boardSize / 64, left: `${point.x}%`, top: `${point.y}%`, marginLeft: -boardSize / 64, marginTop: -boardSize / 64 }]} />
            ))}

            <View style={[styles.centerPath, { width: boardSize * 0.14, height: boardSize * 0.14, borderRadius: boardSize * 0.07, marginLeft: -boardSize * 0.07, marginTop: -boardSize * 0.07 }]} />

            {allTokens.map((token) => (
              <TokenChip key={token.id} token={token} color={PLAYER_META[token.color].accent} boardSize={boardSize} reducedMotion={reducedMotion}
                selectable={!isBotTurn && game.phase === 'moving' && getLegalTokens(currentPlayer, game.dice!).some((legal) => legal.id === token.id)}
                onPress={() => selectToken(token)}
              />
            ))}
          </LinearGradient>
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.dicePanel}>
            <Text style={styles.label}>Dice</Text>
            <Animated.View style={[styles.dice, { transform: [{ rotate: reducedMotion ? '0deg' : boardRotation }] }]}>
              <Text style={styles.diceValue}>{dice}</Text>
            </Animated.View>
            <Pressable style={[styles.rollButton, (game.phase !== 'rolling' || isBotTurn) && styles.disabledButton]} onPress={rollDice} disabled={rolling || game.phase !== 'rolling' || isBotTurn}>
              <Text style={styles.rollButtonText}>{rolling || isBotTurn ? 'Please wait...' : game.phase === 'moving' ? 'Choose a token' : 'Roll Dice'}</Text>
            </Pressable>
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.label}>Now playing</Text>
            <Text style={styles.playerName}>{isBotTurn ? `Bot · ${botDifficulty}` : PLAYER_META[currentPlayer.id].name}</Text>
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
