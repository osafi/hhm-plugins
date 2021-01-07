let room = HBInit();

room.pluginSpec = {
  name: 'osafi/stats',
  author: 'osafi',
  version: '1.0.0',
  config: {},
  configDescriptions: {},
  dependencies: ['osafi/game-state', 'osafi/ball-touch', 'sav/commands'],
  order: {
    onGameTick: {
      after: ['osafi/game-state', 'osafi/ball-touch'],
    },
  },
  incompatible_with: [],
};

let statePlugin;

let ballDistribution = {
  0: 0,
  1: 0,
  2: 0,
};
let playerPossession = {};
let lastTouchedBy = null;

function updateBallDistribution() {
  ballDistribution[getArea(room.getBallPosition().x)] += 1;
}

function getArea(positionX) {
  if (positionX > 90) {
    return 2;
  } else if (positionX < -90) {
    return 1;
  } else {
    return 0;
  }
}

function updatePossession() {
  if (lastTouchedBy) {
    playerPossession[lastTouchedBy.id] += 1;
  }
}

function calculatePercentages(object) {
  let percentages = {};
  let sum = 0;
  for (let key in object) {
    sum = sum + object[key];
  }

  if (sum === 0) {
    return object;
  }

  for (let key in object) {
    const percentage = (100 / sum) * object[key];
    percentages[key] = Math.round((percentage + Number.EPSILON) * 100) / 100;
  }

  return percentages;
}

room.getBallDistribution = () => calculatePercentages(ballDistribution);
room.getPlayerPossession = () => calculatePercentages(playerPossession);

room.onGameStart = () => {
  ballDistribution = {
    0: 0,
    1: 0,
    2: 0,
  };

  for (let player of room.getPlayerList()) {
    playerPossession[player.id] = 0;
  }
};

room.onGameTick = () => {
  if (statePlugin.getGameState() === statePlugin.states.BALL_IN_PLAY) {
    updateBallDistribution();
    updatePossession();
  }
};

room.onPlayerTouchedBall = (player) => {
  lastTouchedBy = player;
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
};

// DEBUG helpers
room.onCommand0_ball = () => {
  const { x: ballX, y: ballY } = room.getBallPosition();
  room.sendAnnouncement(`Ball: ${ballX}, ${ballY}`);
};

room.onCommand0_dist = () => {
  room.sendAnnouncement(`Distribution: ${JSON.stringify(room.getBallDistribution())}`);
};

room.onCommand0_poss = () => {
  room.sendAnnouncement(`Possession: ${JSON.stringify(room.getPlayerPossession())}`);
};
