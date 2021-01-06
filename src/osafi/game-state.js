let room = HBInit();

room.pluginSpec = {
  name: 'osafi/game-state',
  author: 'osafi',
  version: '1.0.0',
  dependencies: ['sav/commands'],
  incompatible_with: ['sav/game-state'],
};

const states = {
  STOPPED: 0,
  AWAITING_KICKOFF: 1,
  BALL_IN_PLAY: 2,
  GOAL_CELEBRATION: 3,
  PAUSED: 4,
};

let previousState = states.STOPPED;
let state = states.STOPPED;

function triggerGameStateChange(newState) {
  previousState = state;
  state = newState;
  room.triggerEvent('onGameStateChanged', state, previousState);
}

room.states = states;
room.onGameStart = () => triggerGameStateChange(states.AWAITING_KICKOFF);
room.onGameStop = () => triggerGameStateChange(states.STOPPED);
room.onGamePause = () => triggerGameStateChange(states.PAUSED);
room.onGameUnpause = () => triggerGameStateChange(previousState);
room.onTeamGoal = () => triggerGameStateChange(states.GOAL_CELEBRATION);
room.onPositionsReset = () => triggerGameStateChange(states.AWAITING_KICKOFF);

room.getGameState = () => state;

room.onGameTick = () => {
  if (state === states.AWAITING_KICKOFF && (room.getBallPosition().x !== 0 || room.getBallPosition().y !== 0)) {
    triggerGameStateChange(states.BALL_IN_PLAY);
  }
};

// DEBUG helpers
room.onCommand0_state = () => {
  room.sendAnnouncement(`Game state: ${Object.keys(states).find((key) => states[key] === state)}`);
};
