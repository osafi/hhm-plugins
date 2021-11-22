const td = require('testdouble');
const any = td.matchers.anything;
const captor = td.matchers.captor;

describe('team', () => {
  const pluginPath = '../../src/osafi/team';

  const admin = makePlayer({ id: 111, admin: true });
  const nonAdmin = makePlayer({ id: 222 });

  describe('swap command', () => {
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

  describe('shuffle command', () => {
    pluginTest(pluginPath, 'error when non-admin player tries to use command to shuffle teams', ({ room, setPlayers }) => {
      const player123 = makePlayer({ id: 123, team: 2 });
      setPlayers([player123]);

      room.onCommand0_shuffle(nonAdmin);

      td.verify(room.sendAnnouncement('Only room admin can use the shuffle command'));
      td.verify(room.setPlayerTeam(), { times: 0, ignoreExtraArgs: true });
    });

    pluginTest(pluginPath, 'evenly assigns all players to a team', ({ room, setPlayers }) => {
      const player123 = makePlayer({ id: 123, team: 0 });
      const player456 = makePlayer({ id: 456, team: 0 });
      const player789 = makePlayer({ id: 789, team: 0 });
      const player987 = makePlayer({ id: 987, team: 0 });
      setPlayers([player123, player456, player789, player987]);

      room.onCommand0_shuffle(admin);

      const teamAssignments = captureTeamAssignments({ room, expectedAssignments: 4 });
      expect(teamAssignments[1]).toHaveSize(2);
      expect(teamAssignments[2]).toHaveSize(2);
    });

    pluginTest(pluginPath, 'assigns extra player to blue team if teams are uneven', ({ room, setPlayers }) => {
      const player123 = makePlayer({ id: 123, team: 0 });
      const player456 = makePlayer({ id: 456, team: 0 });
      const player789 = makePlayer({ id: 789, team: 0 });
      setPlayers([player123, player456, player789]);

      room.onCommand0_shuffle(admin);

      const teamAssignments = captureTeamAssignments({ room, expectedAssignments: 3 });
      expect(teamAssignments[1]).toHaveSize(1);
      expect(teamAssignments[2]).toHaveSize(2);
    });

    pluginTest(pluginPath, 'randomizes player assignments', ({ room, setPlayers }) => {
      const players = Array(100)
        .fill(0)
        .map((_, index) => makePlayer({ id: index }));
      setPlayers(players);

      room.onCommand0_shuffle(admin);
      const firstTeamAssignments = captureTeamAssignments({ room, expectedAssignments: 100 });

      room.onCommand0_shuffle(admin);
      const secondTeamAssignments = captureTeamAssignments({ room, expectedAssignments: 100 });

      expect(secondTeamAssignments[1]).not.toEqual(firstTeamAssignments[1]);
      expect(secondTeamAssignments[2]).not.toEqual(firstTeamAssignments[2]);

      room.onCommand0_shuffle(admin);
      const thirdTeamAssignments = captureTeamAssignments({ room, expectedAssignments: 100 });

      expect(thirdTeamAssignments[1]).not.toEqual(secondTeamAssignments[1]);
      expect(thirdTeamAssignments[2]).not.toEqual(secondTeamAssignments[2]);
    });

    function captureTeamAssignments({ room, expectedAssignments }) {
      const playerIdCaptor = captor();
      const teamIdCaptor = captor();
      td.verify(room.setPlayerTeam(playerIdCaptor.capture(), teamIdCaptor.capture()), { times: expectedAssignments });

      room.setPlayerTeam = td.func(); // reset setPlayerTeam stub to support capturing multiple times

      const playerIds = playerIdCaptor.values;
      const teamIds = teamIdCaptor.values;

      return playerIds.reduce(
        (acc, playerId, index) => {
          const team = teamIds[index];
          acc[team].push(playerId);
          return acc;
        },
        { 1: [], 2: [] }
      );
    }
  });
});
