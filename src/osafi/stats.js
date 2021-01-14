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

const Areas = { CENTER: 0, RED: 1, BLUE: 2 };

let statePlugin;

let ballDistribution = {
  [Areas.CENTER]: 0,
  [Areas.RED]: 0,
  [Areas.BLUE]: 0,
};
let playerPossession = {};
let lastPlayerToTouchBall = null;
let updateStats = false;

function updateBallDistribution() {
  ballDistribution[getArea(room.getBallPosition().x)] += 1;
}

function getArea(positionX) {
  if (positionX > 90) {
    return Areas.BLUE;
  } else if (positionX < -90) {
    return Areas.RED;
  } else {
    return Areas.CENTER;
  }
}

function updatePossession() {
  if (lastPlayerToTouchBall) {
    playerPossession[lastPlayerToTouchBall.auth] += 1;
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
    [Areas.CENTER]: 0,
    [Areas.RED]: 0,
    [Areas.BLUE]: 0,
  };

  playerPossession = room.getPlayerList().reduce((acc, p) => ({ ...acc, [p.auth]: 0 }), {});
};

room.onGameTick = () => {
  if (updateStats) {
    updateBallDistribution();
    updatePossession();
  }
};

room.onPlayerJoin = (player) => {
  if (!playerPossession[player.auth]) {
    playerPossession[player.auth] = 0;
  }
};

room.onGameStateChanged = (state) => {
  updateStats = state === statePlugin.states.BALL_IN_PLAY;
};

room.onPlayerTouchedBall = (player) => {
  lastPlayerToTouchBall = player;
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
  const dist = room.getBallDistribution();
  room.sendAnnouncement(`Distribution:\nRED - ${dist[Areas.RED]}%\nCENTER - ${dist[Areas.CENTER]}%\nBLUE - ${dist[Areas.BLUE]}%`);
};

room.onCommand0_poss = () => {
  const players = room.getPlayerList();
  const possessions = Object.entries(room.getPlayerPossession())
    .sort(([_, poss1], [__, poss2]) => poss2 - poss1)
    .map(([auth, poss]) => players.find((p) => p.auth === auth).name + ': ' + poss + '%');
  room.sendAnnouncement(`Possession:\n${possessions.join('\n')}`);
};
