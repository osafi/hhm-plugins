let room = HBInit();

room.pluginSpec = {
  name: 'osafi/haxstats',
  author: 'osafi',
  version: '1.0.0',
  config: {},
  configDescriptions: {},
  dependencies: ['osafi/stats'],
  order: {
    onTeamVictory: {
      after: ['osafi/stats'],
    },
  },
  incompatible_with: [],
};

let haxstatsUrl;
let authorization;
let customGameSummaryUrl;

async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.text();
      room.log(`Bad response from HaxStats API: ${response.status} - ${response.statusText} - ${body}`, HHM.log.level.ERROR);
    } else {
      return response;
    }
  } catch (error) {
    room.log(error.message, HHM.log.level.ERROR);
  }
}

room.onPlayerJoin = async (player) => {
  const playerData = {
    auth: player.auth,
    name: player.name,
  };
  room.log(`Sending player data: ${JSON.stringify(playerData)}`, HHM.log.level.WARN);
  await postData(`${haxstatsUrl}/players`, playerData);
};

let getTeamPossession;
let getGoals;
let getPlayerStats;
const Teams = { RED: 1, BLUE: 2 };

function teamName(teamId) {
  return teamId === Teams.RED ? 'RED' : 'BLUE';
}

room.onTeamVictory = async (scores) => {
  const winningTeam = scores.red > scores.blue ? Teams.RED : Teams.BLUE;
  const teamPossession = getTeamPossession();

  const goals = getGoals().map((g) => ({
    scoringTeam: teamName(g.scoringTeam),
    scorerAuth: g.scorer.auth,
    assisterAuth: g.assister ? g.assister.auth : null,
    ownGoal: g.ownGoal,
  }));

  const playerStats = getPlayerStats().map((s) => ({
    playerAuth: s.player.auth,
    team: teamName(s.player.team),
    possession: s.possession,
    shotsOnGoal: s.shotsOnGoal,
    goals: s.goals,
    assists: s.assists,
    ownGoals: s.ownGoals,
    win: s.player.team === winningTeam ? 1 : 0,
    loss: s.player.team !== winningTeam ? 1 : 0,
  }));

  const game = {
    redScore: scores.red,
    blueScore: scores.blue,
    redPossession: teamPossession[Teams.RED],
    bluePossession: teamPossession[Teams.BLUE],
    winningTeam: teamName(winningTeam),
    goals,
    playerStats,
  };

  room.log(`Sending game data: ${JSON.stringify(game)}`, HHM.log.level.WARN);
  const response = await postData(`${haxstatsUrl}/games`, game);

  if (response) {
    let summaryUrl = response.headers.get('Location');
    if (customGameSummaryUrl) {
      const lastSlash = summaryUrl.lastIndexOf('/');
      const gameId = summaryUrl.substring(lastSlash + 1);
      summaryUrl = customGameSummaryUrl.replace('{gameId}', gameId);
    }

    room.sendAnnouncement(`Game Summary: ${summaryUrl}`);
  }
};

room.onRoomLink = () => {
  const config = room.getConfig();
  haxstatsUrl = config.haxstatsUrl;
  customGameSummaryUrl = config.gameSummaryUrl;
  authorization = `Basic ${btoa(config.username + ':' + config.password)}`;

  const statsPlugin = room.getPlugin('osafi/stats');
  getTeamPossession = statsPlugin.getTeamPossession;
  getGoals = statsPlugin.getGoals;
  getPlayerStats = statsPlugin.getPlayerStats;
};
