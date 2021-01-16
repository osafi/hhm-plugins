const td = require('testdouble');

describe('ball touch', () => {
  const pluginPath = '../../src/osafi/ball-touch';

  const fakeStates = { OTHER: 0, BALL_IN_PLAY: 1 };

  pluginTest(
    pluginPath,
    'triggers an onPlayerTouchedBall event when a player touches the ball',
    ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123' });
      const player456 = makePlayer({ auth: '456' });
      setPlayers([player123, player456]);
      startGame();

      setBallPosition(100, 100);

      // Move player 123 just out of touching distance
      setPlayerPosition('123', 74.99, 100);
      progressGame();
      td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 0 });

      // Move player 123 to touching distance
      setPlayerPosition('123', 75, 100);
      progressGame();
      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: false }), { times: 1 });

      // Move player 456 to touching
      setPlayerPosition('456', 100, 75);
      progressGame();
      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: false }), { times: 2 });
      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player456, kicked: false }), { times: 1 });
    }
  );

  pluginTest(pluginPath, 'triggers an onPlayerTouchedBall event when a player kicks the ball', ({ room, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ auth: '123' });
    setPlayers([player123]);
    startGame();

    room.onPlayerBallKick(player123);

    td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: true }), { times: 1 });
  });

  pluginTest(pluginPath, 'only monitors for ball touches when game state is BALL_IN_PLAY', ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.OTHER);

    setPlayers([makePlayer({ auth: '123' })]);
    startGame();
    setBallPosition(1, 1);
    setPlayerPosition('123', 1, 1);
    progressGame();

    td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 0 });
  });

  pluginTest(pluginPath, 'can access the last players to touch/kick the ball', ({ room, setPlayers, startGame, progressGame, setBallPosition, setPlayerPosition }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player111 = makePlayer({ auth: '111' });
    const player222 = makePlayer({ auth: '222' });
    const player333 = makePlayer({ auth: '333' });
    const player444 = makePlayer({ auth: '444' });
    setPlayers([player111, player222, player333, player444]);
    startGame();

    expect(room.getLastTouchedBy()).toEqual([]);

    setBallPosition(100, 100);
    setPlayerPosition('111', 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false }]);

    setPlayerPosition('111', 0, 0);
    setPlayerPosition('222', 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([
      { player: player222, kicked: false },
      { player: player111, kicked: false },
    ]);

    setPlayerPosition('222', 0, 0);
    room.onPlayerBallKick(player333);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([
      { player: player333, kicked: true },
      { player: player222, kicked: false },
      { player: player111, kicked: false },
    ]);

    setPlayerPosition('111', 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([
      { player: player111, kicked: false },
      { player: player333, kicked: true },
      { player: player222, kicked: false },
    ]);

    setPlayerPosition('111', 0, 0);
    room.onPlayerBallKick(player444);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([
      { player: player444, kicked: true },
      { player: player111, kicked: false },
      { player: player333, kicked: true },
    ]);
  });

  pluginTest(pluginPath, 'resets last players to touch the ball', ({ room, setPlayers, startGame, stopGame, progressGame, setBallPosition, setPlayerPosition, resetPositions }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player111 = makePlayer({ auth: '111' });
    setPlayers([player111]);
    startGame();

    setBallPosition(100, 100);
    setPlayerPosition('111', 100, 100);
    progressGame();

    expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false }]);

    stopGame();
    expect(room.getLastTouchedBy()).toEqual([]);

    progressGame();
    expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false }]);

    resetPositions();
    expect(room.getLastTouchedBy()).toEqual([]);
  });
});
