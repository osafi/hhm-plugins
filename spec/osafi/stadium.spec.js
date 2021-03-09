const td = require('testdouble');

describe('stadium', () => {
  const pluginPath = '../../src/osafi/stadium';

  const testPlayer = makePlayer({ id: 123, admin: true });

  const sampleStadium1 = {
    name: 'Sample Map 1',
    goals: [
      { p0: [-800, 100], p1: [-800, -100], team: 'red' },
      { p0: [800, 100], p1: [800, -100], team: 'blue' },
    ],
  };
  const sampleStadium2 = {
    name: 'Sample Map 2',
    goals: [
      { p0: [-700, 100], p1: [-700, -100], team: 'red' },
      { p0: [700, 100], p1: [700, -100], team: 'blue' },
    ],
  };

  pluginTest(
    pluginPath,
    'can get a list of available stadiums',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.onCommand0_stadiums(testPlayer);

      const expectedMessage =
        'Available Stadiums:\n' +
        '1. Classic\n' +
        '2. Easy\n' +
        '3. Small\n' +
        '4. Big\n' +
        '5. Rounded\n' +
        '6. Hockey\n' +
        '7. Big Hockey\n' +
        '8. Big Easy\n' +
        '9. Big Rounded\n' +
        '10. Huge\n' +
        '11. Sample Map 1\n' +
        '12. Sample Map 2';

      td.verify(room.sendAnnouncement(expectedMessage));
    },
    false
  );

  pluginTest(pluginPath, 'can set the stadium to a default stadium', ({ room }) => {
    room.setStadium('Classic');
    td.verify(room.setDefaultStadium('Classic'));
  });

  pluginTest(
    pluginPath,
    'can set the stadium to a custom stadium',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.setStadium('Sample Map 2');
      td.verify(room.setCustomStadium(JSON.stringify(sampleStadium2)));
    },
    false
  );

  pluginTest(
    pluginPath,
    'error logged when setting stadium to one that doesnt exist',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.setStadium('Sample Map 3');

      td.verify(room.log('No stadium by name: Sample Map 3', HHM.log.level.ERROR));
      td.verify(room.setDefaultStadium(), { times: 0, ignoreExtraArgs: true });
      td.verify(room.setCustomStadium(), { times: 0, ignoreExtraArgs: true });
    },
    false
  );

  pluginTest(
    pluginPath,
    'can set the stadium via chat command',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.onCommand1_stadium(testPlayer, ['1']);
      td.verify(room.setDefaultStadium('Classic'));

      room.onCommand1_stadium(testPlayer, ['11']);
      td.verify(room.setCustomStadium(JSON.stringify(sampleStadium1)));
    },
    false
  );

  pluginTest(
    pluginPath,
    'error when invalid stadium number given via chat command',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.onCommand1_stadium(testPlayer, ['0']);
      td.verify(room.sendAnnouncement('0 is not a valid stadium'));
      td.verify(room.sendAnnouncement(td.matchers.contains('Available Stadiums:')));

      room.onCommand1_stadium(testPlayer, ['13']);
      td.verify(room.sendAnnouncement('13 is not a valid stadium'));
      td.verify(room.sendAnnouncement(td.matchers.contains('Available Stadiums:')), { times: 2 });

      td.verify(room.setDefaultStadium(), { times: 0, ignoreExtraArgs: true });
      td.verify(room.setCustomStadium(), { times: 0, ignoreExtraArgs: true });
    },
    false
  );

  pluginTest(pluginPath, 'error when non-admin player tries to change stadium', ({ room }) => {
    const nonAdmin = makePlayer({ id: 456 });
    room.onCommand1_stadium(nonAdmin, ['1']);
    td.verify(room.sendAnnouncement('Only room admin can change stadium'));

    td.verify(room.setDefaultStadium(), { times: 0, ignoreExtraArgs: true });
    td.verify(room.setCustomStadium(), { times: 0, ignoreExtraArgs: true });
  });

  pluginTest(
    pluginPath,
    'can get goal post locations for custom maps',
    ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        additionalStadiums: [sampleStadium1, sampleStadium2],
      });
      room.onRoomLink();

      room.setStadium(sampleStadium1.name);
      expect(room.getStadiumGoalPosts()).toEqual({
        red: { top: { x: -800, y: 100 }, bottom: { x: -800, y: -100 } },
        blue: { top: { x: 800, y: 100 }, bottom: { x: 800, y: -100 } },
      });

      room.setStadium(sampleStadium2.name);
      expect(room.getStadiumGoalPosts()).toEqual({
        red: { top: { x: -700, y: 100 }, bottom: { x: -700, y: -100 } },
        blue: { top: { x: 700, y: 100 }, bottom: { x: 700, y: -100 } },
      });
    },
    false
  );

  pluginTest(pluginPath, 'can get goal post locations for default maps', ({ room }) => {
    expect(room.getStadiumGoalPosts()).toEqual({
      red: { top: { x: -370, y: 64 }, bottom: { x: -370, y: -64 } },
      blue: { top: { x: 370, y: 64 }, bottom: { x: 370, y: -64 } },
    });

    room.setStadium('Huge');
    expect(room.getStadiumGoalPosts()).toEqual({
      red: { top: { x: -700, y: 100 }, bottom: { x: -700, y: -100 } },
      blue: { top: { x: 700, y: 100 }, bottom: { x: 700, y: -100 } },
    });
  });
});
