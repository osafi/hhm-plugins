const td = require('testdouble');

global.HHM = {
  log: {
    level: {
      TRACE: `trace`,
      DEBUG: `debug`,
      INFO: `info`,
      WARN: `warn`,
      ERROR: `error`,
    },
  },
};

global.makePlayer = (partial) => ({
  id: partial.id || 0,
  position: partial.position || null,
});

global.pluginTest = (pluginModulePath, testName, testFunction) => {
  it(testName, async () => {
    const room = td.object();
    td.when(room.getConfig()).thenDo(() => room.pluginSpec.config);

    td.when(room.getBallPosition()).thenReturn(null);
    const setBallPosition = (x, y) => {
      td.when(room.getBallPosition()).thenReturn({ x, y });
    };

    td.when(room.getPlayerList()).thenReturn([]);
    const setPlayers = (players) => {
      td.when(room.getPlayerList()).thenReturn(players);
    };

    const setPlayerPosition = (playerId, x, y) => {
      let player = room.getPlayerList().find((p) => p.id === playerId);
      if (!player) throw new Error(`[setPlayerPosition] No player by id: ${playerId}`);
      player.position = { x, y };
    };

    const startGame = () => {
      setBallPosition(0, 0);
      room.onGameStart();
    };

    const progressGame = (ticks = 1) => {
      for (let i = 0; i < ticks; i++) {
        room.onGameTick();
      }
    };

    const goal = (teamId) => {
      room.onTeamGoal(teamId);
    };

    const resetPositions = () => {
      setBallPosition(0, 0);
      room.onPositionsReset();
    };

    HBInit = td.when(td.func()()).thenReturn(room);
    require(pluginModulePath);

    try {
      await testFunction({
        room,
        setPlayers,
        setPlayerPosition,
        setBallPosition,
        startGame,
        progressGame,
        goal,
        resetPositions,
      });
    } finally {
      delete require.cache[require.resolve(pluginModulePath)];
    }
  });
};
