let room = HBInit();

room.pluginSpec = {
  name: 'osafi/ball-touch',
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

function updateLastPlayersToTouchBall(player) {
  const indexOfPlayer = lastPlayersToTouchBall.findIndex((p) => p.auth === player.auth);
  if (indexOfPlayer !== -1) {
    lastPlayersToTouchBall.splice(indexOfPlayer, 1);
  }

  lastPlayersToTouchBall.unshift(player);

  if (lastPlayersToTouchBall.length > 3) {
    lastPlayersToTouchBall.pop();
  }
}

room.getLastTouchedBy = () => lastPlayersToTouchBall;

room.onGameStop = () => {
  lastPlayersToTouchBall = [];
};

room.onPositionsReset = () => {
  lastPlayersToTouchBall = [];
};

room.onGameTick = () => {
  if (statePlugin.getGameState() === statePlugin.states.BALL_IN_PLAY) {
    for (let player of room.getPlayerList()) {
      if (player.position != null) {
        const distanceToBall = pointDistance(player.position, room.getBallPosition());
        if (distanceToBall < triggerDistance) {
          updateLastPlayersToTouchBall(player);
          room.triggerEvent('onPlayerTouchedBall', lastPlayersToTouchBall[0]);
        }
      }
    }
  }
};

room.onRoomLink = () => {
  statePlugin = room.getPlugin('osafi/game-state');
};

// DEBUG helpers
room.onCommand0_playertouch = () => {
  room.sendAnnouncement(`last touch: ${JSON.stringify(lastPlayersToTouchBall)}`);
};
room.onCommand0_touch = () => {
  room.sendAnnouncement(`last touch: ${lastPlayersToTouchBall.map((p) => p.name)}`);
};

room.onTeamGoal = () => {
  room.sendAnnouncement(`last touch: ${lastPlayersToTouchBall.map((p) => p.name)}`);
};
