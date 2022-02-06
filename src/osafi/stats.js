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
let playerStats = new Map();
let teamPossession = {};
let goals = [];
let lastTouch = null;
let updateStats = false;

function makeStats(player) {
  return {
    player,
    possession: 0,
    goals: 0,
    assists: 0,
    ownGoals: 0,
    shotsOnGoal: 0,
  };
}

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
    playerStats.get(lastTouch.player.auth).possession += 1;
    teamPossession[lastTouch.player.team] += 1;
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
room.getTeamPossession = () => calculatePercentages(teamPossession);
room.getGoals = () => goals;
room.getPlayerStats = () => {
  const stats = [...playerStats.values()];
  const possessionTimeByPlayer = stats.reduce((acc, stat) => ({ ...acc, [stat.player.auth]: stat.possession }), {});
  const possessionPercentageByPlayer = calculatePercentages(possessionTimeByPlayer);
  return stats.map((s) => ({ ...s, possession: possessionPercentageByPlayer[s.player.auth] }));
};

room.onGameStart = () => {
  lastTouch = null;

  ballDistribution = {
    [Areas.CENTER]: 0,
    [Areas.RED]: 0,
    [Areas.BLUE]: 0,
  };

  playerStats.clear();
  room.getPlayerList().forEach((p) => {
    playerStats.set(p.auth, makeStats(p));
  });

  teamPossession = {
    1: 0,
    2: 0,
  };

  goals = [];
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
      scoringTeam: teamId,
      scorer: scoringTouch.player,
      ownGoal: true,
    };

    playerStats.get(goal.scorer.auth).ownGoals += 1;
  } else {
    const touchesAfterScoringTouch = lastTouches.slice(scoringTouchIndex + 1);
    const assistingTouch = touchesAfterScoringTouch.find((touch) => touch.kicked || touch.player.team === teamId);
    const assister = assistingTouch && assistingTouch.player.team === teamId ? assistingTouch.player : null;
    goal = {
      scoringTeam: teamId,
      scorer: scoringTouch.player,
      assister,
      ownGoal: false,
    };

    playerStats.get(goal.scorer.auth).goals += 1;
    if (goal.assister) {
      playerStats.get(goal.assister.auth).assists += 1;
    }
  }

  goals.push(goal);
  room.sendAnnouncement(goalString(goal));
};

room.onPlayerJoin = (player) => {
  if (!playerStats.has(player.auth)) {
    playerStats.set(player.auth, makeStats(player));
  }
};

room.onGameStateChanged = (state) => {
  updateStats = state === statePlugin.states.BALL_IN_PLAY;
};

room.onPlayerTouchedBall = (touch) => {
  lastTouch = touch;
  if (touch.shotOnGoal) {
    playerStats.get(touch.player.auth).shotsOnGoal += 1;
  }
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
  getLastTouchedBy = room.getPlugin('osafi/ball-touch').getLastTouchedBy;
};

// DEBUG helpers

function logDistribution() {
  const dist = room.getBallDistribution();
  room.sendAnnouncement(`Distribution:\nRED - ${dist[Areas.RED]}%\nCENTER - ${dist[Areas.CENTER]}%\nBLUE - ${dist[Areas.BLUE]}%`);
}

function logTeamPossession() {
  const teamPossession = room.getTeamPossession();
  room.sendAnnouncement(`Team Possession: RED - ${teamPossession[1]} | BLUE - ${teamPossession[2]}`);
}

function logGoals() {
  room.sendAnnouncement(goals.map(goalString).join('\n'));
}

function logStats() {
  const stats = room.getPlayerStats();
  try {
    const statStrings = stats
      .sort((s1, s2) => s2.possession - s1.possession)
      .map((s) => `${s.player.name}: ${s.goals}G | ${s.assists}A | ${s.ownGoals}OG | ${s.shotsOnGoal}S | ${s.possession}%P`);
    room.sendAnnouncement(`Player Stats:\n${statStrings.join('\n')}`);
  } catch (e) {
    room.log('failed to log player stats', HHM.log.level.ERROR);
    room.log(`stats: ${JSON.stringify(stats)}`, HHM.log.level.ERROR);
    room.log(`players: ${JSON.stringify(room.getPlayerList())}`, HHM.log.level.ERROR);
  }
}

room.onTeamVictory = () => {
  logDistribution();
  logTeamPossession();
  logStats();
};
