const td = require('testdouble');

describe('stats', () => {
  const pluginPath = '../../src/osafi/stats';

  describe('ball in play', () => {
    pluginTest(
      pluginPath,
      'ball in play after moving from initial position and a goal has not occurred',
      ({ room, progressGame, setBallPosition, startGame, goal, resetPositions }) => {
        startGame();
        expect(room.isBallInPlay()).toBeFalse();

        setBallPosition(1, 0);
        progressGame(1);
        expect(room.isBallInPlay()).toBeTrue();

        goal(1);
        progressGame(1);
        expect(room.isBallInPlay()).toBeFalse();

        resetPositions();
        progressGame(1);
        expect(room.isBallInPlay()).toBeFalse();

        setBallPosition(0, 1);
        progressGame(1);
        expect(room.isBallInPlay()).toBeTrue();
      }
    );
  });

  describe('ball distribution', () => {
    pluginTest(pluginPath, 'calculates distribution of ball on the court', ({ room, progressGame, setBallPosition, startGame }) => {
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

    pluginTest(pluginPath, 'does not update distribution while ball is not in play', ({ room, progressGame, setBallPosition, startGame, goal }) => {
      startGame();
      setBallPosition(100, 0);
      goal(1);

      progressGame(1);
      expect(room.getBallDistribution()).toEqual({
        0: 0,
        1: 0,
        2: 0,
      });
    });
  });

  fdescribe('player ball possession time', () => {
    pluginTest(pluginPath, 'blah', ({ room, progressGame, setPlayers, setPlayerPosition, startGame }) => {
      setPlayers([makePlayer({ id: 1 }), makePlayer({ id: 2 })]);
      startGame();

      progressGame(1);

      setPlayerPosition(1, 5, 5);
      progressGame(1);

      setPlayerPosition(2, 13, 51);
      progressGame(1);
    });
  });
});
