var room = HBInit();

room.pluginSpec = {
  name: `osafi/stats`,
  author: `osafi`,
  version: `1.0.0`,
  config: {},
  configDescriptions: {},
  dependencies: [`sav/core`],
  order: {},
  incompatible_with: [],
};

let ballInPlay = false;
let goalScored = false;
let ballDistribution = {
  0: 0,
  1: 0,
  2: 0,
};

room.onGameStart = () => {
  ballInPlay = false;
  goalScored = false;
  ballDistribution = {
    0: 0,
    1: 0,
    2: 0,
  };
};

room.onGameTick = () => {
  console.log('players: ', room.getPlayerList());

  const ball = room.getBallPosition();

  if (!ballInPlay) {
    if (goalScored || (ball.x === 0 && ball.y === 0)) {
      return;
    }

    ballInPlay = true;
  }

  updateBallDistribution(ball);
};

room.onTeamGoal = (teamId) => {
  ballInPlay = false;
  goalScored = true;
};

room.onPositionsReset = () => {
  goalScored = false;
};

room.isBallInPlay = () => {
  return ballInPlay;
};

room.getBallDistribution = () => {
  return calculatePercentages(ballDistribution);
};

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

// DEBUG helpers
room.onCommand0_ball = () => {
  const { x: ballX, y: ballY } = room.getBallPosition();
  room.sendAnnouncement(`Ball ${ballX}, ${ballY}`);
};

room.onCommand0_dist = () => {
  room.sendAnnouncement(`Distribution ${JSON.stringify(room.getBallDistribution())}`);
};
