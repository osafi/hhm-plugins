let room = HBInit();

room.pluginSpec = {
  name: 'osafi/haxstats',
  author: 'osafi',
  version: '1.0.0',
  config: {},
  configDescriptions: {},
  dependencies: ['osafi/stats'],
  order: {
    onTeamVictory: {
      after: ['osafi/stats'],
    },
  },
  incompatible_with: [],
};

let haxstatsUrl;
let authorization;

room.onPlayerJoin = async (player) => {
  try {
    const response = await fetch(`${haxstatsUrl}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({
        auth: player.auth,
        name: player.name,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      room.log(`Unable to register player with HaxStats API: ${response.status} - ${response.statusText} - ${body}`, HHM.log.level.ERROR);
    } else {
      room.log('Registered player with HaxStats API', HHM.log.level.INFO);
    }
  } catch (error) {
    room.log(error.message, HHM.log.level.ERROR);
  }
};

room.onRoomLink = () => {
  const config = room.getConfig();
  haxstatsUrl = config.haxstatsUrl;
  authorization = `Basic ${btoa(config.username + ':' + config.password)}`;
};
