const td = require('testdouble');
const anything = td.matchers.anything;

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

global.makePlayer = (partial = {}) => ({
  id: partial.id || 0,
  auth: partial.auth || '',
  position: partial.position || { x: 0, y: 0 },
  team: partial.team || 0,
  name: partial.name || '',
  admin: !!partial.admin,
});

const setupInitialMocks = (room) => {
  td.when(room.getConfig()).thenDo(() => room.pluginSpec.config);
  td.when(room.getPlugin(anything())).thenReturn(td.object());
  td.when(room.getBallPosition()).thenReturn(null);
  td.when(room.getPlayerList()).thenReturn([]);
};

const generateGameHelpers = (room) => {
  // TODO: make set*Position functions take position object (nullable) or x, y
  const setBallPosition = (x, y) => {
    td.when(room.getBallPosition()).thenReturn({ x, y });
  };

  const setPlayers = (players) => {
    td.when(room.getPlayerList()).thenReturn(players);
  };

  const joinGame = (player) => {
    const players = room.getPlayerList();
    players.push(player);
    setPlayers(players);
    room.onPlayerJoin(player);
  };

  const leaveGame = (player) => {
    const newPlayers = room.getPlayerList().filter((p) => p.id === player.id || p.auth === player.auth);
    setPlayers(newPlayers);
    room.onPlayerLeave(player);
  };

  const setPlayerPosition = (playerIdOrAuth, x, y) => {
    let player = room.getPlayerList().find((p) => p.id === playerIdOrAuth || p.auth === playerIdOrAuth);
    if (!player) throw new Error(`[setPlayerPosition] No player by id/auth: ${playerIdOrAuth}`);
    player.position = { x, y };
  };

  const startGame = () => {
    setBallPosition(0, 0);
    room.onGameStart();
  };

  const stopGame = () => {
    room.onGameStop();
  };

  const pauseGame = () => {
    room.onGamePause();
  };

  const unpauseGame = () => {
    room.onGameUnpause();
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

  return {
    setPlayers,
    joinGame,
    leaveGame,
    setPlayerPosition,
    setBallPosition,
    startGame,
    stopGame,
    pauseGame,
    unpauseGame,
    progressGame,
    goal,
    resetPositions,
  };
};

const makePluginTestFunction =
  (testFn) =>
  (pluginModulePath, testName, testFunction, initializeRoom = true) => {
    testFn(testName, async () => {
      const room = td.object();
      setupInitialMocks(room);

      HBInit = td.when(td.func()()).thenReturn(room);
      require(pluginModulePath);
      if (initializeRoom) {
        room.onRoomLink('init');
      }

      try {
        await testFunction({ room, ...generateGameHelpers(room) });
      } finally {
        delete require.cache[require.resolve(pluginModulePath)];
      }
    });
  };
global.pluginTest = makePluginTestFunction(it);
global.fpluginTest = makePluginTestFunction(fit);
global.xpluginTest = makePluginTestFunction(xit);
