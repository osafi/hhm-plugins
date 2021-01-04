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

const Team = { SPECTATORS: 0, RED: 1, BLUE: 2 };

let ballInPlay = false;
let goalScored = false;
let ballDistribution = {
  0: 0,
  1: 0,
  2: 0,
};
let playerPossession = {};
let lastTouchedBy = null;

room.onGameStart = () => {
  ballInPlay = false;
  goalScored = false;
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
  const ball = room.getBallPosition();

  if (!ballInPlay) {
    if (goalScored || (ball.x === 0 && ball.y === 0)) {
      return;
    }

    ballInPlay = true;
  }

  updateBallDistribution(ball);
  updatePossession(ball);
};

room.onTeamGoal = (teamId) => {
  ballInPlay = false;
  goalScored = true;
};

room.onPositionsReset = () => {
  goalScored = false;
};

room.isBallInPlay = () => ballInPlay;

room.getBallDistribution = () => calculatePercentages(ballDistribution);

room.getPlayerPossession = () => calculatePercentages(playerPossession);

// function getPlayersByTeam() {
//   room.getPlayerList().reduce(
//     (acc, value) => {
//       acc[value.team].push(value);
//       return acc;
//     },
//     { [Team.RED]: [], [Team.BLUE]: [] }
//   );
// }

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
