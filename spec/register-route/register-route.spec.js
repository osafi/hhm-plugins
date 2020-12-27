const nock = require('nock');
const td = require('testdouble');

describe("register-route", () => {
    const pluginPath = '../../src/osafi/register-route'

    pluginTest(pluginPath, "POSTs the room link to a director with authorization", async (room) => {
        td.when(room.getConfig()).thenReturn({
            username: 'john',
            password: 'doe',
            directorRegistrationUrl: 'http://my-director:8080/routes',
            route: '/my-room'
        });

        const scope = nock('http://my-director:8080')
            .post('/routes', { path: '/my-room', target: 'https://haxball.com' })
            .basicAuth({ user: 'john', pass: 'doe' })
            .reply(200)


        await room.onRoomLink('https://haxball.com');

        expect(scope.isDone()).toBeTruthy();
    });

    pluginTest(pluginPath, 'Logs error when response from director is not 2xx', async (room) => {
        nock('http://localhost:8080')
            .post('/routes')
            .reply(400, 'something bad happened');

        await room.onRoomLink('https://haxball.com');

        td.verify(room.log('Unable to register room URL with director: 400 - Bad Request - something bad happened', HHM.log.level.ERROR));
    });
});