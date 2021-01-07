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

  pluginTest(pluginPath, 'can access the last player to touch the ball', ({ room, setPlayers, startGame, progressGame, setBallPosition, setPlayerPosition }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player = makePlayer({ id: 123 });
    setPlayers([player]);
    startGame();

    setBallPosition(100, 100);
    setPlayerPosition(123, 100, 100);

    expect(room.getLastTouchedBy()).toBeUndefined();

    progressGame();

    expect(room.getLastTouchedBy()).toEqual(player);
  });
});
