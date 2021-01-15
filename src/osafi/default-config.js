var room = HBInit();

room.pluginSpec = {
  name: `osafi/default-config`,
  author: `osafi`,
  version: `1.0.0`,
  config: {
    scoreLimit: 3,
    timeLimit: 3,
    stadium: 'Classic',
    redTeamColors: {
      angle: 0,
      text: 0xffffff,
      colors: [0xe56e56],
    },
    blueTeamColors: {
      angle: 0,
      text: 0xffffff,
      colors: [0x5689e5],
    },
  },
  configDescriptions: {},
  dependencies: [],
  order: {},
  incompatible_with: [],
};

function setRoomConfig() {
  const config = room.getConfig();
  room.setScoreLimit(config.scoreLimit);
  room.setTimeLimit(config.timeLimit);
  room.setDefaultStadium(config.stadium);

  const { redTeamColors, blueTeamColors } = config;
  room.setTeamColors(1, redTeamColors.angle, redTeamColors.text, redTeamColors.colors);
  room.setTeamColors(2, blueTeamColors.angle, blueTeamColors.text, blueTeamColors.colors);

  room.log(`Applied default config: ${JSON.stringify(config)}`, HHM.log.level.INFO);
}

room.onRoomLink = () => {
  setRoomConfig();
};
room.onCommand0_defaults = () => {
  setRoomConfig();
};