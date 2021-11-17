var room = HBInit();

room.pluginSpec = {
  name: `osafi/team`,
  author: `osafi`,
  version: `1.0.0`,
  config: {},
  configDescriptions: {},
  dependencies: [],
  order: {},
  incompatible_with: [],
};

room.onCommand0_swap = (player) => {
  if (!player.admin) {
    room.sendAnnouncement('Only room admin can use the swap command');
    return;
  }

  room
    .getPlayerList()
    .filter((p) => p.team != 0)
    .forEach((p) => room.setPlayerTeam(p.id, (p.team % 2) + 1));
};
