const td = require('testdouble');

describe('ball touch', () => {
  const pluginPath = '../../src/osafi/ball-touch';

  const fakeStates = { OTHER: 0, BALL_IN_PLAY: 1 };

  pluginTest(pluginPath, 'triggers an event when a player touches the ball', ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ id: 123 });
    const player456 = makePlayer({ id: 456 });
    setPlayers([player123, player456]);
    startGame();

    setBallPosition(100, 100);

    // Move player 123 just out of touching distance
    setPlayerPosition(123, 74.99, 100);
    progressGame();
    td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 0 });

    // Move player 123 to touching distance
    setPlayerPosition(123, 75, 100);
    progressGame();
    td.verify(room.triggerEvent('onPlayerTouchedBall', player123));

    // Move player 456 to touching
    setPlayerPosition(456, 100, 75);
    progressGame();
    td.verify(room.triggerEvent('onPlayerTouchedBall', player456));
  });

  pluginTest(pluginPath, 'only monitors for ball touches when game state is BALL_IN_PLAY', ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.OTHER);

    setPlayers([makePlayer({ id: 123 })]);
    startGame();
    setBallPosition(1, 1);
    setPlayerPosition(123, 1, 1);
    progressGame();

    td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 0 });
  });

  pluginTest(pluginPath, 'can access the last players to touch the ball', ({ room, setPlayers, startGame, progressGame, setBallPosition, setPlayerPosition }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player111 = makePlayer({ auth: 111 });
    const player222 = makePlayer({ auth: 222 });
    const player333 = makePlayer({ auth: 333 });
    const player444 = makePlayer({ auth: 444 });
    setPlayers([player111, player222, player333, player444]);
    startGame();

    expect(room.getLastTouchedBy()).toEqual([]);

    setBallPosition(100, 100);
    setPlayerPosition(111, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player111]);

    setPlayerPosition(111, 0, 0);
    setPlayerPosition(222, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player222, player111]);

    setPlayerPosition(222, 0, 0);
    setPlayerPosition(333, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player333, player222, player111]);

    setPlayerPosition(333, 0, 0);
    setPlayerPosition(111, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player111, player333, player222]);

    setPlayerPosition(111, 0, 0);
    setPlayerPosition(444, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player444, player111, player333]);
  });

  pluginTest(pluginPath, 'resets last players to touch the ball', ({ room, setPlayers, startGame, stopGame, progressGame, setBallPosition, setPlayerPosition, resetPositions }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player111 = makePlayer({ id: 111 });
    setPlayers([player111]);
    startGame();

    setBallPosition(100, 100);
    setPlayerPosition(111, 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([player111]);

    stopGame();
    expect(room.getLastTouchedBy()).toEqual([]);

    progressGame();
    expect(room.getLastTouchedBy()).toEqual([player111]);

    resetPositions();
    expect(room.getLastTouchedBy()).toEqual([]);
  });
});
