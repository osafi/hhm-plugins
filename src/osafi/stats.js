var room = HBInit();

room.pluginSpec = {
  name: 'osafi/stats',
  author: 'osafi',
  version: '1.0.0',
  config: {},
  configDescriptions: {},
  dependencies: ['osafi/game-state', 'sav/commands'],
  order: {
    onGameTick: {
      after: ['osafi/game-state'],
    },
  },
  incompatible_with: [],
};

// const Team = { SPECTATORS: 0, RED: 1, BLUE: 2 };

let statePlugin;

let ballDistribution = {
  0: 0,
  1: 0,
  2: 0,
};
let playerPossession = {};
let lastTouchedBy = null;

function updateBallDistribution(ball) {
  ballDistribution[getArea(ball.x)] += 1;
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

function updatePossession(ball) {
  updateLastTouchedBy(ball);

  if (lastTouchedBy) {
    playerPossession[lastTouchedBy.id] += 1;
  }
}

const ballRadius = 10;
const playerRadius = 15;
const triggerDistance = ballRadius + playerRadius + 0.01;
function updateLastTouchedBy(ballPosition) {
  for (let player of room.getPlayerList()) {
    if (player.position != null) {
      const distanceToBall = pointDistance(player.position, ballPosition);
      if (distanceToBall < triggerDistance) {
        lastTouchedBy = player;
      }
    }
  }
}

function pointDistance(p1, p2) {
  var d1 = p1.x - p2.x;
  var d2 = p1.y - p2.y;
  return Math.sqrt(d1 * d1 + d2 * d2);
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
    const ball = room.getBallPosition();
    updateBallDistribution(ball);
    updatePossession(ball);
  }
};

room.getBallDistribution = () => calculatePercentages(ballDistribution);
room.getPlayerPossession = () => calculatePercentages(playerPossession);
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
