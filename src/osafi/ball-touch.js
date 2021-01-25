let room = HBInit();

room.pluginSpec = {
  name: 'osafi/ball-touch',
  author: 'osafi',
  version: '1.0.0',
  config: {
    touchHistoryLength: 5,
  },
  configDescriptions: {},
  dependencies: ['osafi/math', 'osafi/game-state', 'sav/commands'],
  order: {
    onGameTick: {
      after: ['osafi/game-state'],
    },
  },
  incompatible_with: [],
};

let touchHistoryLength;

let statePlugin;
let math;

let lastPlayersToTouchBall = [];

const ballRadius = 10;
const playerRadius = 15;
const triggerDistance = ballRadius + playerRadius + 0.01;

function updateLastPlayersToTouchBall(playerThatTouched, kicked, shotOnGoal) {
  const indexOfPlayer = lastPlayersToTouchBall.findIndex(({ player }) => player.auth === playerThatTouched.auth);
  if (indexOfPlayer !== -1) {
    lastPlayersToTouchBall.splice(indexOfPlayer, 1);
  }

  lastPlayersToTouchBall.unshift({ player: playerThatTouched, kicked, shotOnGoal });

  if (lastPlayersToTouchBall.length > touchHistoryLength) {
    lastPlayersToTouchBall.pop();
  }
}

// Goal post positions for 'Huge' stadium
const goalPostPositions = {
  red: { top: { x: -700, y: 100 }, bottom: { x: -700, y: -100 } },
  blue: { top: { x: 700, y: 100 }, bottom: { x: 700, y: -100 } },
};

function isShotOnGoal(player) {
  const playerPosition = player.position;
  const inRange = player.team === 1 ? playerPosition.x > 90 : playerPosition.x < -90;

  if (!inRange) return false;

  const ballPosition = room.getBallPosition();
  const posts = player.team === 1 ? goalPostPositions.blue : goalPostPositions.red;

  if (math.pointInTriangle(ballPosition, playerPosition, posts.top, posts.bottom)) {
    room.sendAnnouncement(`${player.name}: shot on goal!`, null, 0x00ff00, 'small-italic', 0);
    return true;
  }
  return false;
}

room.getLastTouchedBy = () => [...lastPlayersToTouchBall];

room.onGameStop = () => {
  lastPlayersToTouchBall = [];
};

room.onPositionsReset = () => {
  lastPlayersToTouchBall = [];
};

room.onGameTick = () => {
  if (statePlugin.getGameState() === statePlugin.states.BALL_IN_PLAY) {
    const ballPosition = room.getBallPosition();
    for (let player of room.getPlayerList()) {
      if (player.position != null) {
        const distanceToBall = math.pointDistance(player.position, ballPosition);
        if (distanceToBall < triggerDistance) {
          updateLastPlayersToTouchBall(player, false, false);
          room.triggerEvent('onPlayerTouchedBall', lastPlayersToTouchBall[0]);
        }
      }
    }
  }
};

room.onPlayerBallKick = (player) => {
  const shotOnGoal = isShotOnGoal(player);
  updateLastPlayersToTouchBall(player, true, shotOnGoal);
  room.triggerEvent('onPlayerTouchedBall', lastPlayersToTouchBall[0]);
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
  math = room.getPlugin('osafi/math');
  touchHistoryLength = room.getConfig().touchHistoryLength;
};

// DEBUG helpers
room.onCommand0_playertouch = () => {
  room.sendAnnouncement(`last touch: ${JSON.stringify(lastPlayersToTouchBall)}`);
};

function logLastTouches() {
  const data = lastPlayersToTouchBall.map((t) => `[${t.shotOnGoal ? 'S' : t.kicked ? 'K' : 'T'}] ${t.player.name}`);
  room.sendAnnouncement(`last touch: ${data}`);
}
room.onCommand0_touch = () => {
  logLastTouches();
};
room.onTeamGoal = () => {
  logLastTouches();
};
