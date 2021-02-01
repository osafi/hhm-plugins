const td = require('testdouble');

describe('stats', () => {
  const pluginPath = '../../src/osafi/stats';

  const fakeStates = { GOAL_CELEBRATION: 0, BALL_IN_PLAY: 1 };

  pluginTest(pluginPath, 'calculates distribution of ball on the court', ({ room, progressGame, setBallPosition, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

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

  describe('player possession', () => {
    pluginTest(pluginPath, 'player has possession after touching the ball', ({ room, progressGame, setPlayers, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123' });
      const player456 = makePlayer({ auth: '456' });
      setPlayers([player123, player456]);
      startGame();

      expect(room.getPlayerPossession()).toEqual({
        123: 0,
        456: 0,
      });

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame(50);

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
        456: 0,
      });

      room.onPlayerTouchedBall({ player: player456, kicked: false });
      progressGame(20);

      expect(room.getPlayerPossession()).toEqual({
        123: 71.43,
        456: 28.57,
      });
    });

    pluginTest(pluginPath, 'collects stats for players joining mid-game', ({ room, joinGame, startGame, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;

      startGame();
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123' });
      joinGame(player123);

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame();

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
      });
    });

    pluginTest(pluginPath, 'keeps stats for players re-joining mid-game', ({ room, joinGame, leaveGame, startGame, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;

      const player123 = makePlayer({ auth: '123' });

      joinGame(player123);
      startGame();
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame();

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
      });

      leaveGame(player123);
      joinGame(player123);

      expect(room.getPlayerPossession()).toEqual({
        123: 100,
      });
    });
  });

  describe('team possession', () => {
    pluginTest(pluginPath, 'team possession based on individual player possession', ({ room, progressGame, setPlayers, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123', team: 1 });
      const player456 = makePlayer({ auth: '456', team: 2 });
      const player789 = makePlayer({ auth: '789', team: 1 });
      setPlayers([player123, player456, player789]);
      startGame();

      expect(room.getTeamPossession()).toEqual({
        1: 0,
        2: 0,
      });

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame(50);

      expect(room.getTeamPossession()).toEqual({
        1: 100,
        2: 0,
      });

      room.onPlayerTouchedBall({ player: player456, kicked: false });
      progressGame(20);

      expect(room.getTeamPossession()).toEqual({
        1: 71.43,
        2: 28.57,
      });

      room.onPlayerTouchedBall({ player: player789, kicked: false });
      progressGame(40);

      expect(room.getTeamPossession()).toEqual({
        1: 81.82,
        2: 18.18,
      });
    });
  });

  describe('goals', () => {
    pluginTest(pluginPath, 'player who touched ball last on scoring team is awarded goal', ({ room, setPlayers, startGame, goal }) => {
      const player123 = makePlayer({ auth: '123', team: 1, name: 'player123' });
      const player456 = makePlayer({ auth: '456', team: 2 });
      setPlayers([player123, player456]);
      startGame();

      expect(room.getGoals()).toEqual([]);

      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player456, kicked: false },
        { player: player123, kicked: false },
      ]);

      goal(1);

      expect(room.getGoals()).toEqual([{ scoringTeam: 1, scorer: player123, assister: null, ownGoal: false }]);
      td.verify(room.sendAnnouncement('⚽ Goal by player123'));
    });

    pluginTest(pluginPath, 'is own goal if last player to kick ball is not on the scoring team', ({ room, setPlayers, startGame, goal }) => {
      const player123 = makePlayer({ auth: '123', team: 1 });
      const player456 = makePlayer({ auth: '456', team: 2, name: 'player456' });
      setPlayers([player123, player456]);
      startGame();

      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player456, kicked: true },
        { player: player123, kicked: false },
      ]);

      goal(1);

      expect(room.getGoals()).toEqual([{ scoringTeam: 1, scorer: player456, ownGoal: true }]);
      td.verify(room.sendAnnouncement('🙀 Own Goal by player456'));
    });

    pluginTest(pluginPath, 'previous player on scoring team to touch the ball gets the assist', ({ room, setPlayers, startGame, goal }) => {
      const player123 = makePlayer({ auth: '123', team: 2, name: 'player123' });
      const player456 = makePlayer({ auth: '456', team: 2, name: 'player456' });
      const player789 = makePlayer({ auth: '789', team: 1 });
      setPlayers([player123, player456, player789]);
      startGame();

      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player123, kicked: false },
        { player: player789, kicked: false },
        { player: player456, kicked: false },
      ]);

      goal(2);

      expect(room.getGoals()).toEqual([{ scoringTeam: 2, scorer: player123, assister: player456, ownGoal: false }]);
      td.verify(room.sendAnnouncement('⚽ Goal by player123 | Assisted by player456'));
    });

    pluginTest(pluginPath, 'assist not given if opposing team kicks the ball', ({ room, setPlayers, startGame, goal }) => {
      const player123 = makePlayer({ auth: '123', team: 1 });
      const player456 = makePlayer({ auth: '456', team: 1 });
      const player789 = makePlayer({ auth: '789', team: 2 });
      setPlayers([player123, player456, player789]);
      startGame();

      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player123, kicked: false },
        { player: player789, kicked: true },
        { player: player456, kicked: false },
      ]);

      goal(1);

      expect(room.getGoals()).toEqual([{ scoringTeam: 1, scorer: player123, assister: null, ownGoal: false }]);
    });
  });

  pluginTest(pluginPath, 'does not update stats while ball is not in play', ({ room, setPlayers, progressGame, setBallPosition, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    room.onGameStateChanged(fakeStates.GOAL_CELEBRATION);

    const player = makePlayer({ auth: '123' });
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

  pluginTest(pluginPath, 'resets stats when game is started', ({ room, progressGame, setBallPosition, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ auth: '123', team: 1 });
    const player456 = makePlayer({ auth: '456', team: 2 });
    const player789 = makePlayer({ auth: '789', team: 1 });
    setPlayers([player123, player456, player789]);
    startGame();

    room.onPlayerTouchedBall({ player: player123, kicked: false });
    setBallPosition(-100, 0);
    progressGame();

    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 100,
      2: 0,
    });
    expect(room.getPlayerPossession()).toEqual({
      123: 100,
      456: 0,
      789: 0,
    });
    expect(room.getTeamPossession()).toEqual({
      1: 100,
      2: 0,
    });

    setPlayers([player456, player789]);
    startGame();

    room.onPlayerTouchedBall({ player: player456, kicked: false });
    setBallPosition(100, 0);
    progressGame();
    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 0,
      2: 100,
    });
    expect(room.getPlayerPossession()).toEqual({
      456: 100,
      789: 0,
    });
    expect(room.getTeamPossession()).toEqual({
      1: 0,
      2: 100,
    });
  });
});
