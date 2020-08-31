/*
global
G_model_getRoomSize
G_model_roomGetTileAt
G_model_roomGetActorAt
G_model_isImpassableTile
G_model_setPlayerPosition
G_model_actorGetPosition
G_model_actorSetPosition
G_model_actorSetFacing
G_model_actorGetAllegiance
G_model_playerGetActor
G_model_playerGetWorldPosition
G_model_playerSetWorldPosition
G_model_worldGetCurrentRoom
G_model_tileIsPassable
G_model_addLog
G_model_setUpdateUiThisRound
G_controller_playerInputComplete
G_controller_strikeActor
G_controller_render
Direction
G_FACING_LEFT
G_FACING_RIGHT
*/

/* eslint-disable */
const UP = '8';
const DOWN = '2';
const LEFT = '4';
const PAUSE = '5';
const RIGHT = '6';
const UP_LEFT = '7';
const UP_RIGHT = '9';
const DOWN_LEFT = '1';
const DOWN_RIGHT = '3';
/* eslint-enable */

type Direction = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0';

const changeRoomIfOOb = (player: Player): boolean => {
  const actor = G_model_playerGetActor(player);
  let [px, py] = G_model_actorGetPosition(actor);
  let [wx, wy] = player;
  let origWx = wx;
  let origWy = wy;
  const roomSize = G_model_getRoomSize();
  if (px < 0) {
    wx--;
    px = roomSize - 1;
  }
  if (py < 0) {
    wy--;
    py = roomSize - 1;
  }

  if (px >= roomSize) {
    wx++;
    px = 0;
  }
  if (py >= roomSize) {
    wy++;
    py = 0;
  }
  G_model_playerSetWorldPosition(player, wx, wy);
  G_model_actorSetPosition(actor, px, py);
  if (origWx === wx && origWy === wy) {
    return false;
  } else {
    return true;
  }
};

// const blockIfOOb = (actor: Actor) => {
//   let [px, py] = G_model_actorGetPosition(actor);
//   const roomSize = G_model_getRoomSize();
//   if (px < 0) {
//     px = 0;
//   }
//   if (py < 0) {
//     py = 0;
//   }

//   if (px >= roomSize) {
//     px = roomSize - 1;
//   }
//   if (py >= roomSize) {
//     py = roomSize - 1;
//   }
//   G_model_actorSetPosition(actor, px, py);
// };

const getNextPosition = (
  actor: Actor,
  direction: Direction,
  world: World
): [number, number, number, number, boolean] => {
  let [px, py] = G_model_actorGetPosition(actor);
  const origPx = px;
  const origPy = py;

  switch (direction) {
    case UP:
      py--;
      break;
    case DOWN:
      py++;
      break;
    case LEFT:
      px--;
      break;
    case RIGHT:
      px++;
      break;
    case UP_LEFT:
      px--;
      py--;
      break;
    case UP_RIGHT:
      px++;
      py--;
      break;
    case DOWN_LEFT:
      px--;
      py++;
      break;
    case DOWN_RIGHT:
      px++;
      py++;
  }

  const origNextPx = px;
  const origNextPy = py;
  const origPos: [number, number, number, number, boolean] = [
    origPx,
    origPy,
    origNextPx,
    origNextPy,
    false,
  ];

  const room = G_model_worldGetCurrentRoom(world);
  if (room) {
    const tile = G_model_roomGetTileAt(room, px, py);
    if (tile && !G_model_tileIsPassable(tile)) {
      return origPos;
    }
    const act = G_model_roomGetActorAt(room, px, py);
    if (act) {
      return origPos;
    }
  }

  return [px, py, origNextPx, origNextPy, true];
};

const setFacing = (actor: Actor, x: number, y: number) => {
  let [px, py] = G_model_actorGetPosition(actor);
  const dx = px - x;
  const dy = py - y;
  if (dx > 0) {
    G_model_actorSetFacing(actor, G_FACING_LEFT);
  } else if (dx === 0) {
    if (dy > 0) {
      G_model_actorSetFacing(actor, G_FACING_RIGHT);
    } else {
      G_model_actorSetFacing(actor, G_FACING_LEFT);
    }
  } else {
    G_model_actorSetFacing(actor, G_FACING_RIGHT);
  }
};

const G_controller_movePlayer = (
  player: Player,
  direction: Direction,
  world: World
) => {
  // const directionToCompass = {
  //   [UP]: 'n',
  //   [DOWN]: 's',
  //   [LEFT]: 'w',
  //   [RIGHT]: 'e',
  //   [UP_LEFT]: 'nw',
  //   [UP_RIGHT]: 'ne',
  //   [DOWN_LEFT]: 'sw',
  //   [DOWN_RIGHT]: 'se',
  //   [PAUSE]: 'wait',
  // };

  const actor = G_model_playerGetActor(player);
  // G_model_addLog(`Move: ${directionToCompass[direction]}`);
  G_controller_moveActor(actor, direction, world);
  if (changeRoomIfOOb(player)) {
    G_controller_render(world);
  } else {
    G_controller_playerInputComplete();
  }
};

// returns true if the actor moved or attacked, false if the action could not be done
const G_controller_moveActor = (
  actor: Actor,
  direction: Direction,
  world: World
): boolean => {
  const room = G_model_worldGetCurrentRoom(world);
  let [nextPx, nextPy, origNextPx, origNextPy, moved] = getNextPosition(
    actor,
    direction,
    world
  );
  setFacing(actor, origNextPx, origNextPy);
  G_model_actorSetPosition(actor, nextPx, nextPy);
  const otherActor = G_model_roomGetActorAt(room, origNextPx, origNextPy);
  const myAllegiance = G_model_actorGetAllegiance(actor);
  if (otherActor && myAllegiance !== G_model_actorGetAllegiance(otherActor)) {
    G_controller_strikeActor(actor, otherActor, world);
    return true;
  }
  return moved;
};
