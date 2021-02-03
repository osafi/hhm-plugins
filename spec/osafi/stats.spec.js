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

      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, possession: 0 }),
        jasmine.objectContaining({ player: player456, possession: 0 }),
      ]);

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame(50);

      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, possession: 100 }),
        jasmine.objectContaining({ player: player456, possession: 0 }),
      ]);

      room.onPlayerTouchedBall({ player: player456, kicked: false });
      progressGame(20);

      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, possession: 71.43 }),
        jasmine.objectContaining({ player: player456, possession: 28.57 }),
      ]);
    });

    pluginTest(pluginPath, 'collects stats for players joining mid-game', ({ room, joinGame, startGame, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;

      startGame();
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123' });
      joinGame(player123);

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame();

      expect(room.getPlayerStats()).toEqual([jasmine.objectContaining({ player: player123, possession: 100 })]);
    });

    pluginTest(pluginPath, 'keeps stats for players re-joining mid-game', ({ room, joinGame, leaveGame, startGame, progressGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;

      const player123 = makePlayer({ auth: '123' });

      joinGame(player123);
      startGame();
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      room.onPlayerTouchedBall({ player: player123, kicked: false });
      progressGame();

      expect(room.getPlayerStats()).toEqual([jasmine.objectContaining({ player: player123, possession: 100 })]);

      leaveGame(player123);
      joinGame(player123);

      expect(room.getPlayerStats()).toEqual([jasmine.objectContaining({ player: player123, possession: 100 })]);
    });
  });

  pluginTest(pluginPath, 'keeps stat on players shot attempts', ({ room, setPlayers, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

    const player123 = makePlayer({ auth: '123' });
    const player456 = makePlayer({ auth: '456' });
    setPlayers([player123, player456]);
    startGame();

    expect(room.getPlayerStats()).toEqual([
      jasmine.objectContaining({ player: player123, shotsOnGoal: 0 }),
      jasmine.objectContaining({ player: player456, shotsOnGoal: 0 }),
    ]);

    room.onPlayerTouchedBall({ player: player123, kicked: true, shotOnGoal: false });
    room.onPlayerTouchedBall({ player: player123, kicked: true, shotOnGoal: true });
    room.onPlayerTouchedBall({ player: player456, kicked: true, shotOnGoal: true });
    room.onPlayerTouchedBall({ player: player456, kicked: true, shotOnGoal: true });

    expect(room.getPlayerStats()).toEqual([
      jasmine.objectContaining({ player: player123, shotsOnGoal: 1 }),
      jasmine.objectContaining({ player: player456, shotsOnGoal: 2 }),
    ]);
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
      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, goals: 0 }),
        jasmine.objectContaining({ player: player456, goals: 0 }),
      ]);

      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player456, kicked: false },
        { player: player123, kicked: false },
      ]);

      goal(1);

      expect(room.getGoals()).toEqual([{ scoringTeam: 1, scorer: player123, assister: null, ownGoal: false }]);
      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, goals: 1 }),
        jasmine.objectContaining({ player: player456, goals: 0 }),
      ]);
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
      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123 }),
        jasmine.objectContaining({ player: player456, goals: 0, ownGoals: 1 }),
      ]);
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
      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, goals: 1, assists: 0 }),
        jasmine.objectContaining({ player: player456, goals: 0, assists: 1 }),
        jasmine.objectContaining({ player: player789, goals: 0, assists: 0 }),
      ]);
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
      expect(room.getPlayerStats()).toEqual([
        jasmine.objectContaining({ player: player123, goals: 1, assists: 0 }),
        jasmine.objectContaining({ player: player456, goals: 0, assists: 0 }),
        jasmine.objectContaining({ player: player789, goals: 0, assists: 0 }),
      ]);
    });
  });

  pluginTest(pluginPath, 'does not update stats while ball is not in play', ({ room, setPlayers, progressGame, setBallPosition, startGame }) => {
    room.getPlugin('osafi/game-state').states = fakeStates;
    room.onGameStateChanged(fakeStates.GOAL_CELEBRATION);

    const player = makePlayer({ auth: '123' });
    setPlayers([player]);
    startGame();

    room.onPlayerTouchedBall({ player });
    setBallPosition(100, 0);
    progressGame(5);

    expect(room.getBallDistribution()).toEqual({
      0: 0,
      1: 0,
      2: 0,
    });
    expect(room.getPlayerStats()).toEqual([{ player, possession: 0, goals: 0, assists: 0, ownGoals: 0, shotsOnGoal: 0 }]);
  });

  describe('reset stats when game started', () => {
    pluginTest(pluginPath, 'ball distribution', ({ room, progressGame, setBallPosition, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      startGame();

      setBallPosition(-100, 0);
      progressGame();
      setBallPosition(100, 0);
      progressGame();
      setBallPosition(5, 5);
      progressGame();

      expect(room.getBallDistribution()).toEqual({
        0: 33.33,
        1: 33.33,
        2: 33.33,
      });

      startGame();

      expect(room.getBallDistribution()).toEqual({
        0: 0,
        1: 0,
        2: 0,
      });
    });

    pluginTest(pluginPath, 'team possession', ({ room, progressGame, setPlayers, startGame }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123', team: 1 });
      const player456 = makePlayer({ auth: '456', team: 2 });
      setPlayers([player123, player456]);
      startGame();

      room.onPlayerTouchedBall({ player: player123 });
      progressGame(3);

      room.onPlayerTouchedBall({ player: player456 });
      progressGame(1);

      expect(room.getTeamPossession()).toEqual({
        1: 75,
        2: 25,
      });

      startGame();

      expect(room.getTeamPossession()).toEqual({
        1: 0,
        2: 0,
      });
    });

    pluginTest(pluginPath, 'player stats', ({ room, progressGame, setPlayers, startGame, goal }) => {
      room.getPlugin('osafi/game-state').states = fakeStates;
      room.onGameStateChanged(fakeStates.BALL_IN_PLAY);

      const player123 = makePlayer({ auth: '123', team: 1 });
      const player456 = makePlayer({ auth: '456', team: 2 });
      const player789 = makePlayer({ auth: '789', team: 1 });
      setPlayers([player123, player456, player789]);
      startGame();

      // Goal + assist for team 1
      room.onPlayerTouchedBall({ player: player789, kicked: true, shotOnGoal: true });
      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([
        { player: player789, kicked: true, shotOnGoal: true },
        { player: player123, kicked: false },
      ]);
      goal(1);
      progressGame();

      // Own goal by team 2
      td.when(room.getPlugin('osafi/ball-touch').getLastTouchedBy()).thenReturn([{ player: player456, kicked: true }]);
      goal(1);

      expect(room.getPlayerStats()).toEqual([
        { player: player123, possession: 0, goals: 0, assists: 1, ownGoals: 0, shotsOnGoal: 0 },
        { player: player456, possession: 0, goals: 0, assists: 0, ownGoals: 1, shotsOnGoal: 0 },
        { player: player789, possession: 100, goals: 1, assists: 0, ownGoals: 0, shotsOnGoal: 1 },
      ]);

      // player123 leaves for next game
      setPlayers([player456, player789]);
      startGame();

      expect(room.getPlayerStats()).toEqual([
        { player: player456, possession: 0, goals: 0, assists: 0, ownGoals: 0, shotsOnGoal: 0 },
        { player: player789, possession: 0, goals: 0, assists: 0, ownGoals: 0, shotsOnGoal: 0 },
      ]);
    });
  });
});
