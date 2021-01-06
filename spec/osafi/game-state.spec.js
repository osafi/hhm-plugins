const td = require('testdouble');

describe('game state', () => {
  const pluginPath = '../../src/osafi/game-state';

  pluginTest(
    pluginPath,
    'triggers events with previous state and new state',
    ({ room, startGame, setBallPosition, progressGame, goal, pauseGame, unpauseGame, stopGame, resetPositions }) => {
      const { STOPPED, AWAITING_KICKOFF, BALL_IN_PLAY, GOAL_CELEBRATION, PAUSED } = room.states;

      startGame();
      td.verify(room.triggerEvent('onGameStateChanged', AWAITING_KICKOFF, STOPPED));

      pauseGame();
      td.verify(room.triggerEvent('onGameStateChanged', PAUSED, AWAITING_KICKOFF));

      unpauseGame();
      td.verify(room.triggerEvent('onGameStateChanged', AWAITING_KICKOFF, PAUSED));

      setBallPosition(1, 0);
      progressGame(1);
      td.verify(room.triggerEvent('onGameStateChanged', BALL_IN_PLAY, AWAITING_KICKOFF));

      pauseGame();
      td.verify(room.triggerEvent('onGameStateChanged', PAUSED, BALL_IN_PLAY));

      unpauseGame();
      td.verify(room.triggerEvent('onGameStateChanged', BALL_IN_PLAY, PAUSED));

      goal(1);
      td.verify(room.triggerEvent('onGameStateChanged', GOAL_CELEBRATION, BALL_IN_PLAY));

      resetPositions();
      td.verify(room.triggerEvent('onGameStateChanged', AWAITING_KICKOFF, GOAL_CELEBRATION));

      setBallPosition(0, 1);
      progressGame(1);
      td.verify(room.triggerEvent('onGameStateChanged', BALL_IN_PLAY, AWAITING_KICKOFF));

      stopGame();
      td.verify(room.triggerEvent('onGameStateChanged', STOPPED, BALL_IN_PLAY));
    }
  );

  pluginTest(pluginPath, 'can access current state', ({ room, startGame }) => {
    startGame();
    expect(room.getGameState()).toEqual(room.states.AWAITING_KICKOFF);
  });
});
