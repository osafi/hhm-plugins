let room = HBInit();

room.pluginSpec = {
  name: 'osafi/ball-touch',
  author: 'osafi',
  version: '1.0.0',
  config: {
    touchHistoryLength: 5,
  },
  configDescriptions: {},
  dependencies: ['osafi/game-state', 'sav/commands'],
  order: {
    onGameTick: {
      after: ['osafi/game-state'],
    },
  },
  incompatible_with: [],
};

let touchHistoryLength;
let statePlugin;
let lastPlayersToTouchBall = [];

function pointDistance(p1, p2) {
  const d1 = p1.x - p2.x;
  const d2 = p1.y - p2.y;
  return Math.sqrt(d1 * d1 + d2 * d2);
}

const ballRadius = 10;
const playerRadius = 15;
const triggerDistance = ballRadius + playerRadius + 0.01;

function updateLastPlayersToTouchBall(playerThatTouched, isKick) {
  const indexOfPlayer = lastPlayersToTouchBall.findIndex(({ player }) => player.auth === playerThatTouched.auth);
  if (indexOfPlayer !== -1) {
    lastPlayersToTouchBall.splice(indexOfPlayer, 1);
  }

  lastPlayersToTouchBall.unshift({ player: playerThatTouched, kicked: isKick });

  if (lastPlayersToTouchBall.length > touchHistoryLength) {
    lastPlayersToTouchBall.pop();
  }
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
        const distanceToBall = pointDistance(player.position, ballPosition);
        if (distanceToBall < triggerDistance) {
          updateLastPlayersToTouchBall(player, false);
          room.triggerEvent('onPlayerTouchedBall', lastPlayersToTouchBall[0]);
        }
      }
    }
  }
};

room.onPlayerBallKick = (player) => {
  updateLastPlayersToTouchBall(player, true);
  room.triggerEvent('onPlayerTouchedBall', lastPlayersToTouchBall[0]);
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
  touchHistoryLength = room.getConfig().touchHistoryLength;
};

// DEBUG helpers
room.onCommand0_playertouch = () => {
  room.sendAnnouncement(`last touch: ${JSON.stringify(lastPlayersToTouchBall)}`);
};

function logLastTouches() {
  const data = lastPlayersToTouchBall.map((t) => `[${t.kicked ? 'K' : 'T'}] ${t.player.name}`);
  room.sendAnnouncement(`last touch: ${data}`);
}
room.onCommand0_touch = () => {
  logLastTouches();
};
room.onTeamGoal = () => {
  logLastTouches();
};
