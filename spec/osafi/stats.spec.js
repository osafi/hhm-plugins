const td = require('testdouble');

describe('stats', () => {
  const pluginPath = '../../src/osafi/stats';

  const fakeStates = { OTHER: 0, BALL_IN_PLAY: 1 };

  pluginTest(pluginPath, 'does not update stats while ball is not in play', ({ room, setPlayers, progressGame, setBallPosition, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.OTHER);

    const player = makePlayer({ id: 123 });
    setPlayers([player]);
    startGame();

    room.onPlayerTouchedBall(player);
    setBallPosition(100, 0);
    progressGame(5);

    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 0,
      2: 0,
    });
    expect(room.getPlayerPossession()).toEqual({
      123: 0,
    });
  });

  pluginTest(pluginPath, 'calculates distribution of ball on the court', ({ room, progressGame, setBallPosition, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    startGame();

    // In Blue zone
    setBallPosition(90.1, 0);
    progressGame(60);
    // In middle zone
    setBallPosition(90, 0);
    progressGame(20);
    // At center
    setBallPosition(0, 0);
    progressGame(10);
    // In middle zone
    setBallPosition(-90, 0);
    progressGame(20);
    // In Red zone
    setBallPosition(-90.1, 0);
    progressGame(70);

    expect(room.getBallDistribution()).toEqual({
      0: 27.78,
      1: 38.89,
      2: 33.33,
    });
  });

  pluginTest(pluginPath, 'player has possession after touching the ball', ({ room, progressGame, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ id: 123 });
    const player456 = makePlayer({ id: 456 });
    setPlayers([player123, player456]);
    startGame();

    expect(room.getPlayerPossession()).toEqual({
      123: 0,
      456: 0,
    });

    room.onPlayerTouchedBall(player123);
    progressGame(50);

    expect(room.getPlayerPossession()).toEqual({
      123: 100,
      456: 0,
    });

    room.onPlayerTouchedBall(player456);
    progressGame(20);

    expect(room.getPlayerPossession()).toEqual({
      123: 71.43,
      456: 28.57,
    });
  });

  pluginTest(pluginPath, 'resets stats when game is started', ({ room, progressGame, setBallPosition, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ id: 123 });
    const player456 = makePlayer({ id: 456 });
    setPlayers([player123, player456]);
    startGame();

    room.onPlayerTouchedBall(player123);
    setBallPosition(-100, 0);
    progressGame(1);

    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 100,
      2: 0,
    });
    expect(room.getPlayerPossession()).toEqual({
      123: 100,
      456: 0,
    });

    startGame();

    room.onPlayerTouchedBall(player456);
    setBallPosition(100, 0);
    progressGame(1);
    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 0,
      2: 100,
    });
    expect(room.getPlayerPossession()).toEqual({
      123: 0,
      456: 100,
    });
  });
});
