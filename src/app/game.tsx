import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { playSound } from '../lib/audio';
import { chooseBotMove } from '../lib/bot';
import { recordLocalMatch } from '../lib/matchHistory';
import { LudoBoard } from '../components/game/LudoBoard';
import {
  GameState,
  PLAYER_META,
  createGameState,
  getLegalTokens,
  getTokenDisplayPosition,
  moveToken,
  rollForCurrentPlayer,
  Token,
} from '../lib/ludo';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { makeOnlineActionId, moveOnlineToken, PrivateRoom, rollOnlineDie, subscribeToPrivateRoom } from '../services/rooms/privateRooms';
import { firebaseAuth } from '../services/firebase/client';

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
  const params = useLocalSearchParams<{ roomCode?: string | string[]; finalBoard?: string }>();
  const roomCode = Array.isArray(params.roomCode) ? params.roomCode[0] : params.roomCode;
  const [onlineRoom, setOnlineRoom] = useState<PrivateRoom | null>(null);
  const [onlineError, setOnlineError] = useState('');
  const pendingActionId = useRef<string | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const boardSize = Math.max(180, Math.min(windowWidth - 28, windowHeight * 0.46, 460));
  const playerCount = useGameStore((state) => state.playerCount);
  const selectedMode = useGameStore((state) => state.selectedMode);
  const botDifficulty = useGameStore((state) => state.botDifficulty);
  const soundOn = useSettingsStore((state) => state.soundEnabled);
  const toggleSound = useSettingsStore((state) => state.toggleSound);
  const [localGame, setLocalGame] = useState<GameState>(() => createGameState(selectedMode === 'Play Against Computer' ? 2 : playerCount));
  const game = onlineRoom?.gameState ?? localGame;
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [botCycle, setBotCycle] = useState(0);
  const [message, setMessage] = useState('Roll the dice to begin the match.');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [diceSpin] = useState(() => new Animated.Value(0));
  const botProcessing = useRef(false);
  const matchRecorded = useRef(false);
  const onlineResultOpened = useRef(false);

  const currentPlayer = game.players[game.turnIndex]!;
  const isOnlineTurn = !roomCode || onlineRoom?.players.find((player) => player.seat === game.turnIndex)?.uid === firebaseAuth?.currentUser?.uid;
  const isBotTurn = !roomCode && selectedMode === 'Play Against Computer' && game.turnIndex === 1;
  const winner = game.winner;

  useEffect(() => {
    if (!roomCode) return undefined;
    return subscribeToPrivateRoom(roomCode, (room) => {
      setOnlineRoom(room);
      setOnlineError('');
      if (room?.lastAction?.requestId === pendingActionId.current) {
        pendingActionId.current = null;
        setRolling(false);
      }
    }, (error) => setOnlineError(
      'code' in error && error.code === 'permission-denied'
        ? 'Your account is not a member of this room.'
        : 'Could not connect to the online room. Check your connection.',
    ));
  }, [roomCode]);

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
    if (!winner || matchRecorded.current || roomCode) return;
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
  }, [game.players.length, roomCode, selectedMode, winner]);

  useEffect(() => {
    if (!roomCode || params.finalBoard === '1' || onlineRoom?.status !== 'completed' || !winner || onlineResultOpened.current) return;
    onlineResultOpened.current = true;
    const winnerName = game.players.find((player) => player.id === winner)?.name ?? PLAYER_META[winner].name;
    router.replace({ pathname: '/results', params: { winner, winnerName, online: '1', roomCode } });
  }, [game.players, onlineRoom?.status, params.finalBoard, roomCode, winner]);

  const allTokens = useMemo(() => game.players.flatMap((player) => player.tokens), [game.players]);

  useEffect(() => {
    if (!isBotTurn || game.phase !== 'rolling' || winner || botProcessing.current) return;
    botProcessing.current = true;
    const timer = setTimeout(async () => {
      const rolled = rollForCurrentPlayer(game);
      const roll = rolled.dice ?? 1;
      setDice(roll);
      setLocalGame(rolled);
      setMessage(`Bot rolled ${roll}.`);
      animateDiceRoll();
      if (soundOn) await playSound('roll');

      if (rolled.phase === 'moving') {
        const tokenId = chooseBotMove(rolled, botDifficulty);
        if (tokenId) {
          await new Promise((resolve) => setTimeout(resolve, 520));
          const moved = moveToken(rolled, tokenId);
          setLocalGame(moved);
          if (soundOn) await playSound(moved.lastCapture ? 'capture' : 'move');
          if (moved.winner) {
            if (soundOn) playSound('win');
            setMessage('Bot wins the match.');
          } else {
            setMessage(moved.lastCapture ? 'Bot captured one of your tokens.' : 'Bot moved a token.');
          }
        }
      } else {
        const lostTurnAfterThreeSixes = roll === 6
          && (game.consecutiveSixes ?? 0) >= 2
          && rolled.turnIndex !== game.turnIndex;
        setMessage(lostTurnAfterThreeSixes
          ? 'Bot rolled three sixes. Your turn.'
          : roll === 6 ? 'Bot has no legal move and rolls again.' : 'Bot has no legal move. Your turn.');
      }
      botProcessing.current = false;
      setRolling(false);
      setBotCycle((cycle) => cycle + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [animateDiceRoll, botCycle, botDifficulty, game, isBotTurn, soundOn, winner]);

  const rollDice = async () => {
    if (rolling || winner || game.phase !== 'rolling') return;
    if (roomCode) {
      if (!onlineRoom || !isOnlineTurn) return;
      setRolling(true);
      const requestId = makeOnlineActionId();
      pendingActionId.current = requestId;
      try {
        const result = await rollOnlineDie(roomCode, requestId, onlineRoom.stateVersion ?? 0);
        setDice(result.die);
        setMessage(result.lostTurnAfterThreeSixes
          ? `${currentPlayer.name} rolled three sixes. The turn passes.`
          : result.hasMove ? `${currentPlayer.name} rolled ${result.die}. Choose a token.` : `${currentPlayer.name} rolled ${result.die} and has no legal move.`);
        animateDiceRoll();
        if (soundOn) await playSound('roll');
      } catch (error) {
        if (pendingActionId.current === requestId) pendingActionId.current = null;
        setRolling(false);
        setMessage(error instanceof Error ? error.message : 'Could not roll the online die.');
      }
      return;
    }
    const nextGame = rollForCurrentPlayer(game);
    const nextRoll = nextGame.dice!;
    const lostTurnAfterThreeSixes = nextRoll === 6
      && (game.consecutiveSixes ?? 0) >= 2
      && nextGame.turnIndex !== game.turnIndex;
    setRolling(true);
    setDice(nextRoll);
    setMessage(lostTurnAfterThreeSixes
      ? `${PLAYER_META[currentPlayer.id].name} rolled three sixes. The turn passes.`
      : `${PLAYER_META[currentPlayer.id].name} rolled ${nextRoll}.`);
    setLocalGame(nextGame);

    animateDiceRoll();

    if (soundOn) {
      await playSound('roll');
    }

    const movable = nextGame.phase === 'moving'
      ? getLegalTokens(nextGame.players[nextGame.turnIndex]!, nextRoll)
      : [];
    if (!movable.length) {
      setTimeout(() => {
        setRolling(false);
        setMessage(lostTurnAfterThreeSixes
          ? `${PLAYER_META[currentPlayer.id].name} rolled three sixes. ${PLAYER_META[nextGame.players[nextGame.turnIndex]!.id].name} is up next.`
          : `${PLAYER_META[currentPlayer.id].name} has no legal move. ${PLAYER_META[nextGame.players[nextGame.turnIndex]!.id].name} is up next.`);
      }, 620);
      return;
    }
    setRolling(false);
    setMessage(movable.length === 1 ? 'Tap the highlighted token to move.' : 'Choose one of your highlighted tokens.');
  };

  const selectToken = async (token: Token) => {
    if (rolling || !isOnlineTurn || game.phase !== 'moving' || !getLegalTokens(currentPlayer, game.dice!).some((legal) => legal.id === token.id)) return;
    if (roomCode) {
      setRolling(true);
      const requestId = makeOnlineActionId();
      pendingActionId.current = requestId;
      try {
        const result = await moveOnlineToken(roomCode, token.id, requestId, onlineRoom?.stateVersion ?? 0);
        if (soundOn) await playSound(result.captured ? 'capture' : 'move');
        setMessage(result.winner ? `${PLAYER_META[result.winner as keyof typeof PLAYER_META].name} wins!` : result.captured ? 'Token captured. The shared board is updated.' : 'Move accepted. The shared board is updated.');
      } catch (error) {
        if (pendingActionId.current === requestId) pendingActionId.current = null;
        setRolling(false);
        setMessage(error instanceof Error ? error.message : 'Could not move that token.');
      }
      return;
    }
    const nextGame = moveToken(game, token.id);
    setLocalGame(nextGame);
    setRolling(true);
    if (soundOn) await playSound(nextGame.lastCapture ? 'capture' : 'move');
    setTimeout(() => {
      if (nextGame.winner) {
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

  if (roomCode && (!onlineRoom || !onlineRoom.gameState)) {
    return (
      <LinearGradient colors={['#24102F', '#351345', '#4A174A']} style={styles.background}>
        <View style={styles.loadingContainer}>
          {onlineError ? <Text style={styles.message}>{onlineError}</Text> : <ActivityIndicator color="#FFD700" size="large" />}
          {!onlineError ? <Text style={styles.message}>{onlineRoom?.status === 'waiting' ? 'Waiting for the host to start this room.' : 'Connecting to the room…'}</Text> : null}
          <Pressable onPress={() => router.replace({ pathname: '/room', params: { roomCode } })}><Text style={styles.exitText}>Back to room</Text></Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#24102F', '#351345', '#4A174A']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={() => roomCode ? router.replace({ pathname: '/room', params: { roomCode } }) : router.replace('/home')} style={styles.headerAction}>
            <Text style={styles.exitText}>‹  EXIT</Text>
          </Pressable>
          <Text style={styles.statusText}>CLASSIC  ·  {game.turnIndex + 1}/{game.players.length}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={soundOn ? 'Mute sound' : 'Turn sound on'} onPress={toggleSound} style={styles.headerAction}>
            <Text style={styles.soundText}>{soundOn ? '♫' : '♪̸'}</Text>
          </Pressable>
        </View>

        <View style={styles.playerBar}>
          {game.players.map((player, index) => (
            <View key={player.id} style={[styles.playerPill, index === game.turnIndex && styles.activePlayerPill, { backgroundColor: `${PLAYER_META[player.id].accent}24`, borderColor: index === game.turnIndex ? '#FFD55C' : `${PLAYER_META[player.id].accent}60` }]}>
              <View style={[styles.playerIndicator, { backgroundColor: PLAYER_META[player.id].accent }]}>
                <Text style={styles.playerIndicatorText}>{player.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.playerColor, { color: PLAYER_META[player.id].accent }]}>{!roomCode && selectedMode === 'Play Against Computer' && index === 1 ? 'BOT' : roomCode ? player.name : PLAYER_META[player.id].name}</Text>
              {index === game.turnIndex ? <View style={styles.activeDot} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.boardWrap}>
          <LudoBoard size={boardSize}>
            {allTokens.map((token) => (
              <TokenChip key={token.id} token={token} color={PLAYER_META[token.color].accent} boardSize={boardSize} reducedMotion={reducedMotion}
                selectable={!isBotTurn && isOnlineTurn && game.phase === 'moving' && getLegalTokens(currentPlayer, game.dice!).some((legal) => legal.id === token.id)}
                onPress={() => selectToken(token)}
              />
            ))}
          </LudoBoard>
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.dicePanel}>
            <Text style={styles.label}>Dice</Text>
            <Animated.View style={[styles.dice, { transform: [{ rotate: reducedMotion ? '0deg' : boardRotation }] }]}>
              <Text style={styles.diceValue}>{game.dice ?? dice}</Text>
            </Animated.View>
            <Pressable style={[styles.rollButton, (game.phase !== 'rolling' || isBotTurn || !isOnlineTurn) && styles.disabledButton]} onPress={rollDice} disabled={rolling || game.phase !== 'rolling' || isBotTurn || !isOnlineTurn}>
              <Text style={styles.rollButtonText}>{rolling || isBotTurn ? 'Please wait...' : !isOnlineTurn ? 'Waiting for turn' : game.phase === 'moving' ? 'Choose a token' : 'Roll Dice'}</Text>
            </Pressable>
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.label}>Now playing</Text>
            <Text style={styles.playerName}>{isBotTurn ? `Bot · ${botDifficulty}` : roomCode ? currentPlayer.name : PLAYER_META[currentPlayer.id].name}</Text>
            <Text style={styles.message}>{onlineError || (winner ? `${game.players.find((player) => player.id === winner)?.name ?? PLAYER_META[winner].name} wins!` : message)}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 42, paddingBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 18 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerAction: { minWidth: 42, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  exitText: { color: '#FFC7D9', fontWeight: '900', fontSize: 11, letterSpacing: 0.6 },
  statusText: { color: '#FFF3FD', fontWeight: '900', fontSize: 12, letterSpacing: 1.1 },
  soundText: { color: '#FFD55C', fontWeight: '900', fontSize: 19 },
  playerBar: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginBottom: 10 },
  playerPill: { flex: 1, minWidth: 0, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingHorizontal: 5, paddingVertical: 6, borderWidth: 1 },
  activePlayerPill: { elevation: 4, shadowColor: '#FFD55C', shadowOpacity: 0.24, shadowRadius: 7, shadowOffset: { width: 0, height: 2 } },
  playerIndicator: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 5, borderWidth: 1, borderColor: '#FFF8E8' },
  playerIndicatorText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  playerColor: { flexShrink: 1, fontSize: 10, fontWeight: '900' },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD55C', marginLeft: 4 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  token: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    top: 0,
    left: 0,
  },
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 12,
    gap: 10,
  },
  dicePanel: {
    flex: 1,
    backgroundColor: 'rgba(111,43,103,0.64)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,126,0.32)',
    padding: 12,
    alignItems: 'center',
  },
  infoPanel: {
    flex: 1.2,
    backgroundColor: 'rgba(66,25,74,0.78)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(210,139,206,0.25)',
    padding: 13,
  },
  label: { color: '#E4B9E2', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  dice: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFD45A',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  diceValue: { color: '#4B1A53', fontWeight: '900', fontSize: 28 },
  rollButton: {
    width: '100%',
    backgroundColor: '#FFD45A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rollButtonText: { color: '#4B1A53', fontWeight: '900', letterSpacing: 0.5 },
  disabledButton: { opacity: 0.55 },
  playerName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  message: { marginTop: 6, color: '#F0DAEE', fontSize: 11, lineHeight: 16 },
});
