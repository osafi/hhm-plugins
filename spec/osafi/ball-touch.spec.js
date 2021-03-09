const td = require('testdouble');
const any = td.matchers.anything;

describe('ball touch', () => {
  const pluginPath = '../../src/osafi/ball-touch';

  const fakeStates = { OTHER: 0, BALL_IN_PLAY: 1 };

  pluginTest(
    pluginPath,
    'only monitors for ball touches when game state is BALL_IN_PLAY',
    ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.OTHER);

      const player123 = makePlayer({ auth: '123' });
      setPlayers([player123]);
      startGame();
      setBallPosition(1, 1);
      setPlayerPosition('123', 1, 1);
      progressGame();

      room.onPlayerBallKick(player123);

      td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 0 });
    }
  );

  pluginTest(
    pluginPath,
    'triggers an onPlayerTouchedBall event when a player touches the ball',
    ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

      const mockPointDistance = room.getPlugin('osafi/math').pointDistance;

      const player123 = makePlayer({ auth: '123' });
      const player456 = makePlayer({ auth: '456' });
      const player789 = makePlayer({ auth: '789' });
      setPlayers([player123, player456, player789]);
      startGame();

      const ballPosition = { x: 12, y: 34 };
      setBallPosition(ballPosition.x, ballPosition.y);
      setPlayerPosition('123', 34, 45);
      setPlayerPosition('456', 56, 67);
      setPlayerPosition('789', 78, 89);

      // just out of touching distance
      td.when(mockPointDistance(player123.position, ballPosition)).thenReturn(25.01);
      // within touching distance
      td.when(mockPointDistance(player456.position, ballPosition)).thenReturn(25);
      td.when(mockPointDistance(player789.position, ballPosition)).thenReturn(10);

      progressGame();
      td.verify(room.triggerEvent(), { ignoreExtraArgs: true, times: 2 });
      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player456, kicked: false, shotOnGoal: false }));
      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player789, kicked: false, shotOnGoal: false }));
    }
  );

  pluginTest(pluginPath, 'triggers an onPlayerTouchedBall event when a player kicks the ball', ({ room, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ auth: '123' });
    setPlayers([player123]);
    startGame();

    room.onPlayerBallKick(player123);

    td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: true, shotOnGoal: false }), { times: 1 });
  });

  const sampleGoalPosts = {
    red: { top: { x: -700, y: 100 }, bottom: { x: -700, y: -100 } },
    blue: { top: { x: 800, y: 200 }, bottom: { x: 800, y: -200 } },
  };
  pluginTest(
    pluginPath,
    'marks kick as a shot on goal if ball kicked within opposing goal posts',
    ({ room, setPlayers, startGame, setBallPosition, setPlayerPosition }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

      td.when(room.getPlugin('osafi/stadium').getStadiumGoalPosts()).thenReturn(sampleGoalPosts);

      const mockPointInTriangle = room.getPlugin('osafi/math').pointInTriangle;

      const player123 = makePlayer({ auth: '123', team: 1, position: { x: 100, y: 45 } });
      const player456 = makePlayer({ auth: '456', team: 2, position: { x: -100, y: 67 } });
      setPlayers([player123, player456]);
      startGame();

      setBallPosition(12, 23);

      td.when(mockPointInTriangle(any(), any(), any(), any())).thenReturn(false);
      room.onPlayerBallKick(player123);

      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: true, shotOnGoal: false }));

      td.when(mockPointInTriangle({ x: 12, y: 23 }, { x: 100, y: 45 }, { x: 800, y: 200 }, { x: 800, y: -200 })).thenReturn(true);
      room.onPlayerBallKick(player123);

      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player123, kicked: true, shotOnGoal: true }));

      td.when(mockPointInTriangle({ x: 12, y: 23 }, { x: -100, y: 67 }, { x: -700, y: 100 }, { x: -700, y: -100 })).thenReturn(true);
      room.onPlayerBallKick(player456);

      td.verify(room.triggerEvent('onPlayerTouchedBall', { player: player456, kicked: true, shotOnGoal: true }));
    }
  );

  pluginTest(pluginPath, 'does not check for shot on goal if player not within range', ({ room, setPlayers, startGame, setPlayerPosition }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);
    td.when(room.getPlugin('osafi/stadium').getStadiumGoalPosts()).thenReturn(sampleGoalPosts);

    const mockPointInTriangle = room.getPlugin('osafi/math').pointInTriangle;

    const player123 = makePlayer({ auth: '123', team: 1 });
    const player456 = makePlayer({ auth: '456', team: 2 });
    setPlayers([player123, player456]);
    startGame();

    setPlayerPosition('123', 90, 0);
    setPlayerPosition('456', -90, 0);
    room.onPlayerBallKick(player123);
    room.onPlayerBallKick(player456);

    td.verify(mockPointInTriangle(), { times: 0, ignoreExtraArgs: true });

    setPlayerPosition('123', 90.1, 0);
    setPlayerPosition('456', -90.1, 0);
    room.onPlayerBallKick(player123);
    room.onPlayerBallKick(player456);

    td.verify(mockPointInTriangle(), { times: 2, ignoreExtraArgs: true });
  });

  pluginTest(
    pluginPath,
    'can access the last players to touch/kick the ball',
    ({ room, setPlayers, startGame, progressGame, setBallPosition, setPlayerPosition }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);
      td.when(room.getPlugin('osafi/stadium').getStadiumGoalPosts()).thenReturn(sampleGoalPosts);

      const mockPointDistance = room.getPlugin('osafi/math').pointDistance;

      // initialize the plugin with a new touch history length
      td.when(room.getConfig()).thenReturn({ touchHistoryLength: 3 });
      room.onRoomLink();

      const player111 = makePlayer({ auth: '111' });
      const player222 = makePlayer({ auth: '222' });
      const player333 = makePlayer({ auth: '333' });
      const player444 = makePlayer({ auth: '444' });
      setPlayers([player111, player222, player333, player444]);
      startGame();

      expect(room.getLastTouchedBy()).toEqual([]);

      // setup so whichever player is at (100, 100) is touching the ball
      setBallPosition(100, 100);
      td.when(mockPointDistance({ x: 100, y: 100 }, { x: 100, y: 100 })).thenReturn(0);

      setPlayerPosition('111', 100, 100);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false, shotOnGoal: false }]);

      setPlayerPosition('111', 0, 0);
      setPlayerPosition('222', 100, 100);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([
        { player: player222, kicked: false, shotOnGoal: false },
        { player: player111, kicked: false, shotOnGoal: false },
      ]);

      setPlayerPosition('222', 0, 0);
      room.onPlayerBallKick(player333);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([
        { player: player333, kicked: true, shotOnGoal: false },
        { player: player222, kicked: false, shotOnGoal: false },
        { player: player111, kicked: false, shotOnGoal: false },
      ]);

      setPlayerPosition('111', 100, 100);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([
        { player: player111, kicked: false, shotOnGoal: false },
        { player: player333, kicked: true, shotOnGoal: false },
        { player: player222, kicked: false, shotOnGoal: false },
      ]);

      setPlayerPosition('111', 0, 0);
      setPlayerPosition('444', -100, 0);
      td.when(room.getPlugin('osafi/math').pointInTriangle(any(), any(), any(), any())).thenReturn(true);
      room.onPlayerBallKick(player444);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([
        { player: player444, kicked: true, shotOnGoal: true },
        { player: player111, kicked: false, shotOnGoal: false },
        { player: player333, kicked: true, shotOnGoal: false },
      ]);
    },
    false
  );

  pluginTest(
    pluginPath,
    'resets last players to touch the ball',
    ({ room, setPlayers, startGame, stopGame, progressGame, setBallPosition, setPlayerPosition, resetPositions }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(fakeStates.BALL_IN_PLAY);

      const player111 = makePlayer({ auth: '111' });
      setPlayers([player111]);
      startGame();

      setPlayerPosition('111', 100, 100);
      td.when(room.getPlugin('osafi/math').pointDistance(any(), any())).thenReturn(0);
      progressGame();

      expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false, shotOnGoal: false }]);

      stopGame();
      expect(room.getLastTouchedBy()).toEqual([]);

      progressGame();
      expect(room.getLastTouchedBy()).toEqual([{ player: player111, kicked: false, shotOnGoal: false }]);

      resetPositions();
      expect(room.getLastTouchedBy()).toEqual([]);
    }
  );
});
