const td = require('testdouble');
const any = td.matchers.anything;

describe('team', () => {
  const pluginPath = '../../src/osafi/team';

  const admin = makePlayer({ id: 111, admin: true });
  const nonAdmin = makePlayer({ id: 222 });

  pluginTest(pluginPath, 'swaps all players on a team to the opposite team on command', ({ room, setPlayers }) => {
    const player123 = makePlayer({ id: 123, team: 2 });
    const player456 = makePlayer({ id: 456, team: 1 });
    const player789 = makePlayer({ id: 789, team: 2 });
    const player000 = makePlayer({ id: 000, team: 0 });
    setPlayers([player123, player456, player789, player000]);

    room.onCommand0_swap(admin);

    td.verify(room.setPlayerTeam(123, 1));
    td.verify(room.setPlayerTeam(456, 2));
    td.verify(room.setPlayerTeam(789, 1));
    td.verify(room.setPlayerTeam(000, any()), { times: 0 });
  });

  pluginTest(pluginPath, 'error when non-admin player tries to use command to swap all players', ({ room, setPlayers }) => {
    const player123 = makePlayer({ id: 123, team: 2 });
    setPlayers([player123]);

    room.onCommand0_swap(nonAdmin);

    td.verify(room.sendAnnouncement('Only room admin can use the swap command'));
    td.verify(room.setPlayerTeam(), { times: 0, ignoreExtraArgs: true });
  });
});
