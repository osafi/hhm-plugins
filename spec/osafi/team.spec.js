const td = require('testdouble');
const any = td.matchers.anything;

describe('team', () => {
  const pluginPath = '../../src/osafi/team';

  pluginTest(pluginPath, 'swaps all players on a team to the opposite team on command', ({ room, setPlayers }) => {
    const player123 = makePlayer({ id: 123, team: 2 });
    const player456 = makePlayer({ id: 456, team: 1 });
    const player789 = makePlayer({ id: 789, team: 2 });
    const player000 = makePlayer({ id: 000, team: 0 });
    setPlayers([player123, player456, player789, player000]);

    room.onCommand0_swap();

    td.verify(room.setPlayerTeam(123, 1));
    td.verify(room.setPlayerTeam(456, 2));
    td.verify(room.setPlayerTeam(789, 1));
    td.verify(room.setPlayerTeam(000, any()), { times: 0 });
  });
});