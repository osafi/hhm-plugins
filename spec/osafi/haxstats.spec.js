const nock = require('nock');
const td = require('testdouble');

describe('haxstats', () => {
  const pluginPath = '../../src/osafi/haxstats';

  pluginTest(
    pluginPath,
    'sends player info to haxstats api on joining',
    async ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        username: 'john',
        password: 'doe',
        haxstatsUrl: 'http://my-haxstats',
      });
      room.onRoomLink('doesntmatter');

      const scope = nock('http://my-haxstats', { reqheaders: { 'Content-Type': 'application/json' } })
        .post('/players', { auth: 'unique-auth', name: 'my-name' })
        .basicAuth({ user: 'john', pass: 'doe' })
        .reply(201);

      await room.onPlayerJoin(makePlayer({ auth: 'unique-auth', name: 'my-name' }));

      expect(scope.isDone()).toBeTruthy();
    },
    false
  );

  pluginTest(
    pluginPath,
    'sends game info to haxstats api on team victory',
    async ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        username: 'john',
        password: 'doe',
        haxstatsUrl: 'http://my-haxstats',
      });
      room.onRoomLink('doesntmatter');

      const expectedBody = {
        redScore: 3,
        blueScore: 5,
        redPossession: 25,
        bluePossession: 75,
        winningTeam: 'BLUE',
        goals: [
          {
            scoringTeam: 'RED',
            scorerAuth: 'player123',
            assisterAuth: 'player456',
            ownGoal: false,
          },
          {
            scoringTeam: 'BLUE',
            scorerAuth: 'player123',
            assisterAuth: null,
            ownGoal: true,
          },
        ],
        playerStats: [
          {
            playerAuth: 'player123',
            team: 'RED',
            possession: 37.5,
            shotsOnGoal: 5,
            goals: 2,
            assists: 4,
            ownGoals: 1,
            win: 0,
            loss: 1,
          },
          {
            playerAuth: 'player456',
            team: 'RED',
            possession: 42.5,
            shotsOnGoal: 20,
            goals: 4,
            assists: 2,
            ownGoals: 0,
            win: 0,
            loss: 1,
          },
          {
            playerAuth: 'player789',
            team: 'BLUE',
            possession: 20,
            shotsOnGoal: 3,
            goals: 1,
            assists: 2,
            ownGoals: 0,
            win: 1,
            loss: 0,
          },
        ],
      };

      const scope = nock('http://my-haxstats', { reqheaders: { 'Content-Type': 'application/json' } })
        .post('/games', expectedBody)
        .basicAuth({ user: 'john', pass: 'doe' })
        .reply(201);

      const player123 = makePlayer({ auth: 'player123', team: 1 });
      const player456 = makePlayer({ auth: 'player456', team: 1 });
      const player789 = makePlayer({ auth: 'player789', team: 2 });
      td.when(room.getPlugin('osafi/stats').getTeamPossession()).thenReturn({
        1: 25,
        2: 75,
      });
      td.when(room.getPlugin('osafi/stats').getGoals()).thenReturn([
        { scoringTeam: 1, scorer: player123, assister: player456, ownGoal: false },
        { scoringTeam: 2, scorer: player123, ownGoal: true },
      ]);
      td.when(room.getPlugin('osafi/stats').getPlayerStats()).thenReturn([
        { player: player123, possession: 37.5, goals: 2, assists: 4, ownGoals: 1, shotsOnGoal: 5 },
        { player: player456, possession: 42.5, goals: 4, assists: 2, ownGoals: 0, shotsOnGoal: 20 },
        { player: player789, possession: 20, goals: 1, assists: 2, ownGoals: 0, shotsOnGoal: 3 },
      ]);

      await room.onTeamVictory({
        red: 3,
        blue: 5,
      });

      expect(scope.isDone()).toBeTruthy();
    },
    false
  );

  pluginTest(
    pluginPath,
    'Logs error when response from haxstats api is not 2xx',
    async ({ room }) => {
      td.when(room.getConfig()).thenReturn({
        username: 'john',
        password: 'doe',
        haxstatsUrl: 'http://my-haxstats',
      });
      room.onRoomLink('doesntmatter');

      nock('http://my-haxstats').post('/players').reply(400, 'something bad happened');

      await room.onPlayerJoin(makePlayer());

      td.verify(room.log('Bad response from HaxStats API: 400 - Bad Request - something bad happened', HHM.log.level.ERROR));
    },
    false
  );
});
