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
}

room.setStadium = (stadiumName) => {
  const stadium = stadiums.find((s) => s.name === stadiumName);
  if (stadium) {
    setStadium(stadium);
  } else {
    room.log(`No stadium by name: ${stadiumName}`, HHM.log.level.ERROR);
  }
};

room.getSelectedStadium = () => selectedStadium;

room.getStadiumGoalPosts = () => selectedStadium.goalPosts;

function convertHbsJsonToStadium(hbsJson) {
  const { name, goals } = hbsJson;
  return {
    name,
    default: false,
    goalPosts: {
      [goals[0].team]: { top: { x: goals[0].p0[0], y: goals[0].p0[1] }, bottom: { x: goals[0].p1[0], y: goals[0].p1[1] } },
      [goals[1].team]: { top: { x: goals[1].p0[0], y: goals[1].p0[1] }, bottom: { x: goals[1].p1[0], y: goals[0].p1[1] } },
    },
    hbs: JSON.stringify(hbsJson),
  };
}

async function fetchStadiumFromUrl(stadiumUrl) {
  room.log(`Fetching map from ${stadiumUrl}`, HHM.log.level.INFO);
  const response = await fetch(stadiumUrl);
  if (response.ok) {
    const mapData = await response.json();
    room.log(`Fetched map from ${stadiumUrl}`);
    return mapData;
  } else {
    const body = await response.text();
    room.log(`Unable to load map from ${stadiumUrl}: ${response.status} - ${response.statusText} - ${body}`, HHM.log.level.ERROR);
  }
}

async function loadAdditionalStadiums(additionalStadiums) {
  const result = [];
  for (const data of additionalStadiums) {
    if (typeof data !== 'string') {
      result.push(convertHbsJsonToStadium(data));
    } else {
      const stadiumData = await fetchStadiumFromUrl(data);
      stadiumData && result.push(convertHbsJsonToStadium(stadiumData));
    }
  }
  return result;
}

room.onRoomLink = async () => {
  const config = room.getConfig();

  const additionalStadiums = await loadAdditionalStadiums(config.additionalStadiums);

  stadiums = stadiums.concat(additionalStadiums);

  room.triggerEvent('onStadiumsLoaded');
};

room.onStadiumChange = (stadiumName) => {
  const stadium = stadiums.find((s) => s.name === stadiumName);
  if (stadium) {
    selectedStadium = stadium;
  } else {
    setStadium(selectedStadium);
  }
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
