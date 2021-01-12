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
let updateStats = false;

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
  const objectEntries = Object.entries(object);
  const sum = objectEntries.reduce((acc, [_, v]) => acc + v, 0);
  if (sum === 0) {
    return object;
  }

  return objectEntries.reduce((acc, [key, value]) => {
    const percentage = (100 / sum) * value;
    acc[key] = Math.round((percentage + Number.EPSILON) * 100) / 100;
    return acc;
  }, {});
}

room.getBallDistribution = () => calculatePercentages(ballDistribution);
room.getPlayerPossession = () => calculatePercentages(playerPossession);

room.onGameStart = () => {
  ballDistribution = {
    0: 0,
    1: 0,
    2: 0,
  };

  playerPossession = room.getPlayerList().reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
};

room.onGameTick = () => {
  if (updateStats) {
    updateBallDistribution();
    updatePossession();
  }
};

room.onGameStateChanged = (state) => {
  updateStats = state === statePlugin.states.BALL_IN_PLAY;
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
