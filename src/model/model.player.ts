/*
global
G_model_worldGetCurrentRoom
G_model_actorGetPosition
G_utils_pointRectCollides
*/

// wx, wy, actor, gold
type Player = [number, number, Actor, number];

const G_model_playerGetActor = (player: Player): Actor => {
  return player[2];
};

const G_model_playerGetWorldPosition = (player: Player): [number, number] => {
  return [player[0], player[1]];
};

const G_model_playerGetGold = (player: Player): number => {
  return player[3];
};

const G_model_playerModifyGold = (player: Player, gold: number) => {
  player[3] += gold;
};

const G_model_playerSetWorldPosition = (
  player: Player,
  wx: number,
  wy: number
) => {
  player[0] = wx;
  player[1] = wy;
};

// const G_model_playerIsAtSellTile = (player: Player, world: World): boolean => {
//   const room = G_model_worldGetCurrentRoom(world);
//   const actor = G_model_playerGetActor(player);
//   const [x, y] = G_model_actorGetPosition(actor);

//   // total hack for space reasons, check the place by the merchant
//   return room.id === 0 && x >= 3 && x <= 5 && y >= 11 && y <= 13;
// };

// const G_model_playerIsAtFountainTile = (
//   player: Player,
//   world: World
// ): boolean => {
//   const room = G_model_worldGetCurrentRoom(world);
//   const actor = G_model_playerGetActor(player);
//   const [x, y] = G_model_actorGetPosition(actor);

//   // total hack for space reasons, check the place by the fountain
//   return room.id === 0 && x >= 8 && x <= 10 && y >= 7 && y <= 9;
// };

const G_model_playerIsAtSellTile = (player: Player, world: World): boolean => {
  const room = G_model_worldGetCurrentRoom(world);
  const actor = G_model_playerGetActor(player);
  const [x, y] = G_model_actorGetPosition(actor);

  // total hack for space reasons, check the place by the merchant
  return room.id === 0 && G_utils_pointRectCollides(x, y, 3, 11, 5, 13);
};

const G_model_playerIsAtFountainTile = (
  player: Player,
  world: World
): boolean => {
  const room = G_model_worldGetCurrentRoom(world);
  const actor = G_model_playerGetActor(player);
  const [x, y] = G_model_actorGetPosition(actor);

  // total hack for space reasons, check the place by the fountain
  return room.id === 0 && G_utils_pointRectCollides(x, y, 8, 7, 10, 9);
};
