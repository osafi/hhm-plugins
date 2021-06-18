const td = require('testdouble');

describe('default-config', () => {
  const pluginPath = '../../src/osafi/default-config';

  pluginTest(
    pluginPath,
    'does not set room configuration when room opened and stadiums HAVE NOT been loaded',
    ({ room }) => {
      td.when(room.getPlugin('osafi/stadium').stadiumsLoaded()).thenReturn(false);

      room.onRoomLink();

      td.verify(room.setScoreLimit(), { times: 0, ignoreExtraArgs: true });
      td.verify(room.setTimeLimit(), { times: 0, ignoreExtraArgs: true });
      td.verify(room.getPlugin('osafi/stadium').setStadium(), { times: 0, ignoreExtraArgs: true });
      td.verify(room.setTeamColors(), { times: 0, ignoreExtraArgs: true });
    },
    false
  );

  pluginTest(
    pluginPath,
    'sets room configuration from plugin config when room opened and stadiums HAVE been loaded',
    ({ room }) => {
      td.when(room.getPlugin('osafi/stadium').stadiumsLoaded()).thenReturn(true);
      td.when(room.getConfig()).thenReturn({
        scoreLimit: 5,
        timeLimit: 10,
        stadium: 'Huge',
        redTeamColors: {
          angle: 120,
          text: 0x00ff00,
          colors: [0xff0000, 0x00ff00],
        },
        blueTeamColors: {
          angle: 90,
          text: 0x0000ff,
          colors: [0xefefef, 0xfefefe, 0x010101],
        },
      });

      room.onRoomLink();

      td.verify(room.setScoreLimit(5));
      td.verify(room.setTimeLimit(10));
      td.verify(room.getPlugin('osafi/stadium').setStadium('Huge'));
      td.verify(room.setTeamColors(1, 120, 0x00ff00, [0xff0000, 0x00ff00]));
      td.verify(room.setTeamColors(2, 90, 0x0000ff, [0xefefef, 0xfefefe, 0x010101]));
    },
    false
  );

  pluginTest(pluginPath, 'sets room configuration from plugin config after onStadiumsLoaded event', ({ room }) => {
    td.when(room.getConfig()).thenReturn({
      scoreLimit: 5,
      timeLimit: 10,
      stadium: 'Huge',
      redTeamColors: {
        angle: 120,
        text: 0x00ff00,
        colors: [0xff0000, 0x00ff00],
      },
      blueTeamColors: {
        angle: 90,
        text: 0x0000ff,
        colors: [0xefefef, 0xfefefe, 0x010101],
      },
    });

    room.onStadiumsLoaded();

    td.verify(room.setScoreLimit(5));
    td.verify(room.setTimeLimit(10));
    td.verify(room.getPlugin('osafi/stadium').setStadium('Huge'));
    td.verify(room.setTeamColors(1, 120, 0x00ff00, [0xff0000, 0x00ff00]));
    td.verify(room.setTeamColors(2, 90, 0x0000ff, [0xefefef, 0xfefefe, 0x010101]));
  });

  pluginTest(pluginPath, 'resets room configuration from plugin config on command', ({ room }) => {
    room.onStadiumsLoaded();
    room.onCommand0_defaults();

    td.verify(room.setScoreLimit(3), { times: 2 });
    td.verify(room.setTimeLimit(3), { times: 2 });
    td.verify(room.getPlugin('osafi/stadium').setStadium('Classic'), { times: 2 });
    td.verify(room.setTeamColors(1, 0, 0xffffff, [0xe56e56]), { times: 2 });
    td.verify(room.setTeamColors(2, 0, 0xffffff, [0x5689e5]), { times: 2 });
  });
});
