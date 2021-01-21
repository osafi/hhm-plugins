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
let getLastTouchedBy;

let ballDistribution = {
  [Areas.CENTER]: 0,
  [Areas.RED]: 0,
  [Areas.BLUE]: 0,
};
let playerPossession = {};
let goals = [];
let lastTouch = null;
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
  if (lastTouch) {
    playerPossession[lastTouch.player.auth] += 1;
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

function goalString(goal) {
  const prefix = goal.ownGoal ? '🙀 Own Goal by ' : '⚽ Goal by ';
  const scorerName = goal.scorer.name;
  const assist = goal.assister ? ` | Assisted by ${goal.assister.name}` : '';
  return `${prefix}${scorerName}${assist}`;
}

room.getBallDistribution = () => calculatePercentages(ballDistribution);
room.getPlayerPossession = () => calculatePercentages(playerPossession);
room.getGoals = () => goals;

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

room.onTeamGoal = (teamId) => {
  const lastTouches = getLastTouchedBy();

  const scoringTouchIndex = lastTouches.findIndex((touch) => touch.kicked || touch.player.team === teamId);
  const scoringTouch = lastTouches[scoringTouchIndex];

  let goal;
  if (scoringTouch.player.team !== teamId) {
    goal = {
      scorer: scoringTouch.player,
      ownGoal: true,
    };
  } else {
    const touchesAfterScoringTouch = lastTouches.slice(scoringTouchIndex + 1);
    const assistingTouch = touchesAfterScoringTouch.find((touch) => touch.kicked || touch.player.team === teamId);
    const assister = assistingTouch && assistingTouch.player.team === teamId ? assistingTouch.player : null;
    goal = {
      scorer: scoringTouch.player,
      assister,
      ownGoal: false,
    };
  }

  goals.push(goal);
  room.sendAnnouncement(goalString(goal));
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
  lastTouch = player;
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
  getLastTouchedBy = room.getPlugin('osafi/ball-touch').getLastTouchedBy;
};

// DEBUG helpers
room.onCommand0_ball = () => {
  const { x: ballX, y: ballY } = room.getBallPosition();
  room.sendAnnouncement(`Ball: ${ballX}, ${ballY}`);
};

function logDistribution() {
  const dist = room.getBallDistribution();
  room.sendAnnouncement(`Distribution:\nRED - ${dist[Areas.RED]}%\nCENTER - ${dist[Areas.CENTER]}%\nBLUE - ${dist[Areas.BLUE]}%`);
}

function logPossession() {
  const players = room.getPlayerList();
  const possession = room.getPlayerPossession();
  try {
    const possessionByPlayerName = Object.entries(possession)
      .sort(([_, poss1], [__, poss2]) => poss2 - poss1)
      .map(([auth, poss]) => players.find((p) => p.auth === auth).name + ': ' + poss + '%');
    room.sendAnnouncement(`Possession:\n${possessionByPlayerName.join('\n')}`);
  } catch (e) {
    room.log('failed to log possession', HHM.log.level.ERROR);
    room.log(`players: ${JSON.stringify(players)}`, HHM.log.level.ERROR);
    room.log(`possession: ${JSON.stringify(possession)}`, HHM.log.level.ERROR);
  }
}

function logGoals() {
  room.sendAnnouncement(goals.map(goalString).join('\n'));
}

room.onCommand0_dist = () => {
  logDistribution();
};
room.onCommand0_poss = () => {
  logPossession();
};
room.onCommand0_goal = () => {
  logGoals();
};

room.onTeamVictory = () => {
  logDistribution();
  logPossession();
};
