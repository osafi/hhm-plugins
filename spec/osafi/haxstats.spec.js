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
        .reply(200);

      await room.onPlayerJoin(makePlayer({ auth: 'unique-auth', name: 'my-name' }));

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

      td.verify(room.log('Unable to register player with HaxStats API: 400 - Bad Request - something bad happened', HHM.log.level.ERROR));
    },
    false
  );
});
