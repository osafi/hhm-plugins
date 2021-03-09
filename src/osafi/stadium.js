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
  {
    name: 'Classic',
    default: true,
    goalPosts: {
      red: { top: { x: -370, y: 64 }, bottom: { x: -370, y: -64 } },
      blue: { top: { x: 370, y: 64 }, bottom: { x: 370, y: -64 } },
    },
  },
  {
    name: 'Easy',
    default: true,
    goalPosts: {
      red: { top: { x: -370, y: 90 }, bottom: { x: -370, y: -90 } },
      blue: { top: { x: 370, y: 90 }, bottom: { x: 370, y: -90 } },
    },
  },
  {
    name: 'Small',
    default: true,
    goalPosts: {
      red: { top: { x: -320, y: 55 }, bottom: { x: -320, y: -55 } },
      blue: { top: { x: 320, y: 55 }, bottom: { x: 320, y: -55 } },
    },
  },
  {
    name: 'Big',
    default: true,
    goalPosts: {
      red: { top: { x: -550, y: 80 }, bottom: { x: -550, y: -80 } },
      blue: { top: { x: 550, y: 80 }, bottom: { x: 550, y: -80 } },
    },
  },
  {
    name: 'Rounded',
    default: true,
    goalPosts: {
      red: { top: { x: -370, y: 64 }, bottom: { x: -370, y: -64 } },
      blue: { top: { x: 370, y: 64 }, bottom: { x: 370, y: -64 } },
    },
  },
  {
    name: 'Hockey',
    default: true,
    goalPosts: {
      red: { top: { x: -278, y: 68 }, bottom: { x: -278, y: -68 } },
      blue: { top: { x: 278, y: 68 }, bottom: { x: 278, y: -68 } },
    },
  },
  {
    name: 'Big Hockey',
    default: true,
    goalPosts: {
      red: { top: { x: -390, y: 90 }, bottom: { x: -390, y: -90 } },
      blue: { top: { x: 390, y: 90 }, bottom: { x: 390, y: -90 } },
    },
  },
  {
    name: 'Big Easy',
    default: true,
    goalPosts: {
      red: { top: { x: -550, y: 95 }, bottom: { x: -550, y: -95 } },
      blue: { top: { x: 550, y: 95 }, bottom: { x: 550, y: -95 } },
    },
  },
  {
    name: 'Big Rounded',
    default: true,
    goalPosts: {
      red: { top: { x: -550, y: 80 }, bottom: { x: -550, y: -80 } },
      blue: { top: { x: 550, y: 80 }, bottom: { x: 550, y: -80 } },
    },
  },
  {
    name: 'Huge',
    default: true,
    goalPosts: {
      red: { top: { x: -700, y: 100 }, bottom: { x: -700, y: -100 } },
      blue: { top: { x: 700, y: 100 }, bottom: { x: 700, y: -100 } },
    },
  },
];

let selectedStadium = stadiums[0];

function setStadium(stadium) {
  if (stadium.default) {
    room.setDefaultStadium(stadium.name);
  } else {
    room.setCustomStadium(stadium.hbs);
  }
  selectedStadium = stadium;
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

room.getStadiumGoalPosts = () => {
  return selectedStadium.goalPosts;
};

function getGoalPostsFromHbsData(stadiumData) {
  const { goals } = stadiumData;
  return {
    [goals[0].team]: { top: { x: goals[0].p0[0], y: goals[0].p0[1] }, bottom: { x: goals[0].p1[0], y: goals[0].p1[1] } },
    [goals[1].team]: { top: { x: goals[1].p0[0], y: goals[1].p0[1] }, bottom: { x: goals[1].p1[0], y: goals[0].p1[1] } },
  };
}

room.onRoomLink = () => {
  const config = room.getConfig();

  const additionalStadiums = config.additionalStadiums.map((ad) => ({
    name: ad.name,
    default: false,
    goalPosts: getGoalPostsFromHbsData(ad),
    hbs: JSON.stringify(ad),
  }));
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
