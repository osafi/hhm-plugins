var room = HBInit();

room.pluginSpec = {
  name: `osafi/register-route`,
  author: `osafi`,
  version: `1.0.0`,
  config: {
    directorRegistrationUrl: 'http://localhost:8080/routes',
    username: '',
    password: '',
    route: '/',
  },
  configDescriptions: {},
  dependencies: [],
  order: {},
  incompatible_with: [],
};

async function onRoomLinkHandler(url) {
  const config = room.getConfig();
  const authorization = `Basic ${btoa(config.username + ':' + config.password)}`;
  try {
    const response = await fetch(config.directorRegistrationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({
        path: config.route,
        target: url,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Unable to register room URL with director: ${response.status} - ${response.statusText} - ${body}`);
    }

    room.log('Registered room url with director', HHM.log.level.INFO);
  } catch (error) {
    room.log(error.message, HHM.log.level.ERROR);
  }
}

room.onRoomLink = onRoomLinkHandler;
