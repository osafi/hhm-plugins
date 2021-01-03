const td = require('testdouble');

global.HHM = {
    log: {
        level: {
            TRACE: `trace`,
            DEBUG: `debug`,
            INFO: `info`,
            WARN: `warn`,
            ERROR: `error`,
        }
    }
}

global.pluginTest = (pluginModulePath, testName, testFunction) => {
    it(testName, async () => {
        const room = td.object();
        td.when(room.getConfig()).thenDo(() => room.pluginSpec.config)

        const setBallPosition = (x, y) => {
            td.when(room.getBallPosition()).thenReturn({ x, y });
        }

        const startGame = () => {
            setBallPosition(0, 0);
            room.onGameStart();
        }

        const progressGame = (ticks = 1) => {
            for (let i = 0; i < ticks; i++) {
                room.onGameTick();
            }
        }

        const goal = (teamId) => {
            room.onTeamGoal(teamId);
        }

        const resetPositions = () => {
            setBallPosition(0, 0);
            room.onPositionsReset();
        }

        HBInit = td.when(td.func()()).thenReturn(room);
        require(pluginModulePath);

        try {
            await testFunction({
                room,
                progressGame,
                setBallPosition,
                startGame,
                goal,
                resetPositions
            })
        } finally {
            delete require.cache[require.resolve(pluginModulePath)]
        }
    })
}