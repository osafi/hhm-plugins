const td = require('testdouble');

describe('stats', () => {
  const pluginPath = '../../src/osafi/stats';

  const fakeStates = { OTHER: 0, BALL_IN_PLAY: 1 };

  describe('ball distribution', () => {
    pluginTest(pluginPath, 'does not update distribution while ball is not in play', ({ room, progressGame, setBallPosition, startGame, goal }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(0);

      setBallPosition(100, 0);
      progressGame(1);

      expect(room.getBallDistribution()).toEqual({
        0: 0,
        1: 0,
        2: 0,
      });
    });

    pluginTest(pluginPath, 'calculates distribution of ball on the court', ({ room, progressGame, setBallPosition, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(1);

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

    pluginTest(pluginPath, 'resets distribution when game is started', ({ room, progressGame, setBallPosition, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(1);

      setBallPosition(-100, 0);
      progressGame(1);
      expect(room.getBallDistribution()).toEqual({
        0: 0,
        1: 100,
        2: 0,
      });

      startGame();

      setBallPosition(100, 0);
      progressGame(1);
      expect(room.getBallDistribution()).toEqual({
        0: 0,
        1: 0,
        2: 100,
      });
    });
  });

  describe('player ball possession', () => {
    pluginTest(pluginPath, 'player has possession after touching the ball', ({ room, progressGame, setPlayers, setPlayerPosition, setBallPosition, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(1);

      setPlayers([makePlayer({ id: 123 }), makePlayer({ id: 456 })]);
      startGame();

      // Move player 123 just out of touching distance
      setBallPosition(100, 1);
      setPlayerPosition(123, 74.99, 1);
      progressGame(1);

      expect(room.getPlayerPossession()).toEqual({
        123: 0,
        456: 0,
      });

      // Move player 123 to touching distance
      setPlayerPosition(123, 75, 1);
      progressGame(1);

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
        456: 0,
      });

      // Move player 123 away from ball
      setPlayerPosition(123, 0, 1);
      progressGame(50);

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
        456: 0,
      });

      // Move player 456 to touching distance
      setPlayerPosition(456, 75, 1);
      progressGame(20);

      expect(room.getPlayerPossession()).toEqual({
        123: 71.83,
        456: 28.17,
      });
    });

    pluginTest(pluginPath, 'does not update possession while ball is not in play', ({ room, progressGame, setPlayers, setBallPosition, setPlayerPosition, startGame, goal }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      td.when(room.getPlugin('osafi/game-state').getGameState()).thenReturn(0);

      setPlayers([makePlayer({ id: 123 })]);
      startGame();
      setBallPosition(100, 1);
      setPlayerPosition(123, 75, 1);
      progressGame(1);
      expect(room.getPlayerPossession()).toEqual({
        123: 0,
      });
    });
  });
});
