var room = HBInit();

room.pluginSpec = {
  name: `osafi/stadium`,
  author: `osafi`,
  version: `1.0.0`,
  config: {
    additionalStadiums: [],
  },
  configDescriptions: {},
  dependencies: ['sav/commands'],
  order: {},
  incompatible_with: [],
};

let stadiums = [
  { name: 'Classic', default: true },
  { name: 'Easy', default: true },
  { name: 'Small', default: true },
  { name: 'Big', default: true },
  { name: 'Rounded', default: true },
  { name: 'Hockey', default: true },
  { name: 'Big Hockey', default: true },
  { name: 'Big Easy', default: true },
  { name: 'Big Rounded', default: true },
  { name: 'Huge', default: true },
];

function setStadium(stadium) {
  if (stadium.default) {
    room.setDefaultStadium(stadium.name);
  } else {
    room.setCustomStadium(stadium.hbs);
  }
}

function setStadiumByName(stadiumName) {
  const stadium = stadiums.find((s) => s.name === stadiumName);
  if (!stadium) {
    room.log(`No stadium by name: ${stadiumName}`, HHM.log.level.ERROR);
    return;
  }

  setStadium(stadium);
}

room.setStadium = (stadiumName) => {
  setStadiumByName(stadiumName);
};

room.onRoomLink = () => {
  const config = room.getConfig();
  const additionalStadiums = config.additionalStadiums.map((ad) => ({ name: ad.name, default: false, hbs: JSON.stringify(ad) }));
  stadiums = stadiums.concat(additionalStadiums);
};

function printStadiums() {
  const stadiumList = stadiums.map((stadium, index) => `${index + 1}. ${stadium.name}`).join('\n');
  room.sendAnnouncement(`Available Stadiums:\n${stadiumList}`);
}

room.onCommand0_stadiums = () => {
  printStadiums();
};

room.onCommand1_stadium = (player, [stadiumNumber]) => {
  if (!player.admin) {
    room.sendAnnouncement('Only room admin can change stadium');
    return;
  }

  if (0 < stadiumNumber && stadiumNumber <= stadiums.length) {
    setStadium(stadiums[stadiumNumber - 1]);
  } else {
    room.sendAnnouncement(`${stadiumNumber} is not a valid stadium`);
    printStadiums();
  }
};
