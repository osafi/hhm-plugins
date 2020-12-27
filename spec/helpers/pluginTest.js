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

        global.HBInit = td.when(td.func()()).thenReturn(room);
        require(pluginModulePath);

        try {
            await testFunction(room)
        } finally {
            delete require.cache[require.resolve(pluginModulePath)]
        }
    })
}